"""
KB Loader — tải Knowledge Base từ backend API thay vì hardcode.

Cơ chế hoạt động:
1. AI service gọi warmup_kb() trong startup lifespan → load eager, không lazy
2. Cache 2 tầng trong memory:
   - _pedigree_cache: raw list[dict] từ API
   - _lookup_cache:   dict[type → dict[name → rank]] đã build sẵn
3. Nếu backend không available → fallback về hardcode trong knowledge_base.py
4. get_competency_level_description() cũng có local cache per (competency_id, level)
"""

import logging
import time
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Tầng 1: Cache raw entity list từ API
# ─────────────────────────────────────────────────────────────────────────────
_pedigree_cache: list[dict] = []
_cache_loaded_at: float = 0.0

# ─────────────────────────────────────────────────────────────────────────────
# Tầng 2: Cache lookup dict đã build — KHÔNG rebuild mỗi request
#
# Cấu trúc: { "UNIVERSITY": {"bách khoa": "TIER_1", ...},
#             "COMPANY":    {"vng": "TIER_1", ...},
#             "AGENCY":     {"ogilvy": "TIER_1", ...},
#             ... (bất kỳ type mới nào từ DB đều tự xuất hiện ở đây) }
#
# Thiết kế dict[type → dict[name → rank]] thay vì tuple(uni, comp, agency):
#   - Không có if/elif phân loại type → không vi phạm OCP
#   - Thêm type mới vào DB (vd: CERTIFICATION_BODY) → tự động có trong cache
#     mà không cần sửa code này
# ─────────────────────────────────────────────────────────────────────────────
_lookup_cache: dict[str, dict[str, str]] = {}

# Cache competency level descriptions (immutable, chỉ load 1 lần)
_level_desc_cache: dict[tuple[str, int], Optional[str]] = {}


def _is_cache_stale() -> bool:
    return (time.time() - _cache_loaded_at) > settings.KB_CACHE_TTL_SECONDS


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────


def warmup_kb() -> None:
    """
    Eager-load KB khi service startup. Gọi từ lifespan trong main.py.

    Đảm bảo request đầu tiên không bị delay vì lazy-load.
    Nếu backend không available khi startup → log warning, fallback về hardcode.
    """
    logger.info("Warming up Knowledge Base from backend...")
    _load_and_build(force=True)


def get_lookup_by_type(entity_type: str) -> dict[str, str]:
    """
    Trả về lookup dict {name_lower → rank} cho một loại tổ chức.

    Ví dụ:
        get_lookup_by_type("UNIVERSITY") → {"bách khoa hà nội": "TIER_1", ...}
        get_lookup_by_type("COMPANY")    → {"vng": "TIER_1", "vnpay": "TIER_2", ...}

    Bất kỳ entity_type nào trong DB đều hoạt động — không cần sửa code khi thêm type mới.

    Args:
        entity_type: Tên loại tổ chức (UNIVERSITY, COMPANY, AGENCY, hoặc bất kỳ)

    Returns:
        dict rỗng nếu không có data (knowledge_base.py sẽ fallback về hardcode)
    """
    global _lookup_cache

    # Nếu cache còn sống → trả về ngay, không rebuild
    if _lookup_cache and not _is_cache_stale():
        return _lookup_cache.get(entity_type, {})

    # Cache stale hoặc chưa có → rebuild
    _load_and_build()
    return _lookup_cache.get(entity_type, {})


def get_competency_level_description(competency_id: str, level: int) -> Optional[str]:
    """
    Tra cứu description của một bậc năng lực từ backend, có local cache.

    Competency levels gần như không thay đổi (stable data) nên cache vĩnh viễn
    trong session (không có TTL — nếu cần force refresh thì restart service).

    Dùng để nhúng vào LLM prompt:
        "required_level_description": "Thành thạo: Có thể xây dựng REST API độc lập..."
    """
    cache_key = (competency_id, level)

    # Cache hit — kể cả khi value là None (tức là đã biết không có data)
    if cache_key in _level_desc_cache:
        return _level_desc_cache[cache_key]

    result = _fetch_competency_level(competency_id, level)
    _level_desc_cache[cache_key] = result  # Cache cả None để tránh gọi lại
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────


def _load_and_build(force: bool = False) -> None:
    """
    Load raw data từ backend API, rồi build lookup cache.

    Tách thành 2 bước để rõ ràng:
      Bước 1: _load_raw()   → gọi API, fill _pedigree_cache
      Bước 2: _build_lookup() → build _lookup_cache từ raw cache (không có if/elif)
    """
    _load_raw(force=force)
    _build_lookup()


def _load_raw(force: bool = False) -> None:
    """Bước 1: Gọi API lấy raw entity list, lưu vào _pedigree_cache."""
    global _pedigree_cache, _cache_loaded_at

    if not force and _pedigree_cache and not _is_cache_stale():
        return  # Cache còn sống, không gọi lại

    try:
        url = f"{settings.BACKEND_BASE_URL}/api/knowledge-base/pedigrees"
        with httpx.Client(timeout=5.0) as client:
            response = client.get(url)
            response.raise_for_status()
            entities = response.json().get("result", [])
            _pedigree_cache = entities
            _cache_loaded_at = time.time()
            logger.info(f"Loaded {len(entities)} pedigree entities from backend KB.")

    except Exception as e:
        logger.warning(
            f"Không thể load KB từ backend ({e}). "
            f"Sẽ fallback về hardcode nếu _lookup_cache rỗng."
        )
        # Giữ cache cũ nếu có — service tiếp tục hoạt động với data cũ


def _build_lookup() -> None:
    """
    Bước 2: Build _lookup_cache từ _pedigree_cache.

    Không có if/elif — tự xử lý mọi entity_type.
    Thêm type mới vào DB → tự xuất hiện trong dict mà không cần sửa code.
    """
    global _lookup_cache

    if not _pedigree_cache:
        return  # Giữ nguyên cache cũ (hoặc rỗng → fallback về hardcode)

    new_lookup: dict[str, dict[str, str]] = {}
    for entity in _pedigree_cache:
        etype = entity.get("type", "UNKNOWN")
        name_lower = entity.get("name", "").lower()
        rank = entity.get("rank", "UNKNOWN")

        # setdefault: tạo dict rỗng nếu type chưa có, rồi insert
        # → không cần if/elif cho UNIVERSITY, COMPANY, AGENCY, hay bất kỳ type mới
        new_lookup.setdefault(etype, {})[name_lower] = rank

    _lookup_cache = new_lookup
    logger.debug(
        "KB lookup built: " + ", ".join(f"{t}={len(v)}" for t, v in new_lookup.items())
    )


def _fetch_competency_level(competency_id: str, level: int) -> Optional[str]:
    """Gọi API backend để lấy label+description của một bậc năng lực."""
    try:
        url = f"{settings.BACKEND_BASE_URL}/api/competencies/{competency_id}/levels/{level}"
        with httpx.Client(timeout=3.0) as client:
            response = client.get(url)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json().get("result", {})
            label = data.get("label", "")
            desc = data.get("description", "")
            return f"{label}: {desc}" if label and desc else (label or desc or None)

    except Exception as e:
        logger.debug(
            f"Không thể tra cứu level description [{competency_id}/{level}]: {e}"
        )
        return None
