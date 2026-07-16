"""
Knowledge Base / Ontology cho Matcher Agent.

Cấu trúc đa tầng (4 bậc) thay vì binary TIER_1 vs OTHER.
Hàm check_*_tier() trả về (rank_str, score_float) thay vì string đơn thuần,
giúp Scoring Engine tính bonus linh hoạt theo hệ số thực tế.

TODO (production): Thay thế các list hardcode bên dưới bằng cách
đọc từ bảng pedigree_entities trong DB qua một internal API call.
Interface hàm check_* KHÔNG thay đổi khi switch sang DB-backed mode.
"""

from app.agents.matcher_agent import kb_loader

# ─────────────────────────────────────────────────────────────────────────────
# Hệ số điểm tương ứng với mỗi PedigreeRank
# Khớp với comment trong PedigreeRank.java và V7 migration
# ─────────────────────────────────────────────────────────────────────────────
RANK_SCORE_MAP: dict[str, float] = {
    "INTERNATIONAL": 1.0,
    "TIER_1": 0.8,
    "TIER_2": 0.5,
    "TIER_3": 0.2,
    "UNKNOWN": 0.0,
}

# ─────────────────────────────────────────────────────────────────────────────
# Danh sách trường Đại học — 3 bậc
# (sẽ được thay bằng DB query trong production)
# ─────────────────────────────────────────────────────────────────────────────
UNIVERSITIES: dict[str, str] = {
    # INTERNATIONAL
    "rmit": "INTERNATIONAL",
    "national university of singapore": "INTERNATIONAL",
    "nus": "INTERNATIONAL",
    "mit": "INTERNATIONAL",
    # TIER_1
    "bách khoa hà nội": "TIER_1",
    "bách khoa tp": "TIER_1",
    "bách khoa tphcm": "TIER_1",
    "bách khoa hcm": "TIER_1",
    "khoa học tự nhiên": "TIER_1",
    "công nghệ thông tin": "TIER_1",
    "fpt": "TIER_1",
    "ngoại thương": "TIER_1",
    "kinh tế quốc dân": "TIER_1",
    "ntu": "TIER_1",  # Nanyang Technological
    # TIER_2
    "tôn đức thắng": "TIER_2",
    "quốc gia hà nội": "TIER_2",
    "quốc gia tp": "TIER_2",
    "quốc gia hcm": "TIER_2",
    "đại học huế": "TIER_2",
    "đà nẵng": "TIER_2",
}

# ─────────────────────────────────────────────────────────────────────────────
# Danh sách Công ty Tech (domain: ENGINEERING)
# ─────────────────────────────────────────────────────────────────────────────
TECH_COMPANIES: dict[str, str] = {
    # TIER_1
    "vng": "TIER_1",
    "shopee": "TIER_1",
    "grab": "TIER_1",
    "momo": "TIER_1",
    "fpt software": "TIER_1",
    "fpt": "TIER_1",
    "viettel": "TIER_1",
    "gojek": "TIER_1",
    "cốc cốc": "TIER_1",
    "coc coc": "TIER_1",
    "kms technology": "TIER_1",
    "kms": "TIER_1",
    # TIER_2
    "vnpay": "TIER_2",
    "vnpt": "TIER_2",
    "tiki": "TIER_2",
    "sendo": "TIER_2",
    "techcombank": "TIER_2",
    "tpbank": "TIER_2",
    "mb bank": "TIER_2",
}

# ─────────────────────────────────────────────────────────────────────────────
# Danh sách Agency (domain: SALES_MARKETING)
# ─────────────────────────────────────────────────────────────────────────────
AGENCIES: dict[str, str] = {
    # TIER_1
    "ogilvy": "TIER_1",
    "dentsu": "TIER_1",
    "groupm": "TIER_1",
    "group m": "TIER_1",
    "omnicom": "TIER_1",
    "publicis": "TIER_1",
    # TIER_2
    "novaon": "TIER_2",
    "cheil": "TIER_2",
    "wunderman": "TIER_2",
}


# ─────────────────────────────────────────────────────────────────────────────
# Public API — trả về (rank_string, score_float)
# ─────────────────────────────────────────────────────────────────────────────


def check_university_tier(university_name: str) -> tuple[str, float]:
    """
    Trả về (rank, score) của trường đại học.

    Ưu tiên dùng dữ liệu từ backend API (qua kb_loader cache).
    Fallback về hardcode nếu backend không available.

    Returns:
        ("INTERNATIONAL", 1.0) | ("TIER_1", 0.8) | ("TIER_2", 0.5) |
        ("TIER_3", 0.2) | ("UNKNOWN", 0.0)
    """
    if not university_name:
        return ("UNKNOWN", 0.0)

    name_lower = university_name.lower()

    # Ưu tiên: kiểm tra từ dynamic cache (backend DB)
    dynamic_unis = kb_loader.get_lookup_by_type("UNIVERSITY")
    if dynamic_unis:
        for keyword, rank in dynamic_unis.items():
            if keyword in name_lower or name_lower in keyword:
                return (rank, RANK_SCORE_MAP.get(rank, 0.0))
        # Backend có data nhưng không match → không fallback
        return ("UNKNOWN", 0.0)

    # Fallback: hardcode (khi backend offline)
    for keyword, rank in UNIVERSITIES.items():
        if keyword in name_lower:
            return (rank, RANK_SCORE_MAP[rank])

    return ("UNKNOWN", 0.0)


def check_company_tier(
    company_name: str, domain: str = "ENGINEERING"
) -> tuple[str, float]:
    """
    Trả về (rank, score) của công ty theo domain.

    Ưu tiên dùng dữ liệu từ backend API (qua kb_loader cache).
    Fallback về hardcode nếu backend không available.
    """
    if not company_name:
        return ("UNKNOWN", 0.0)

    name_lower = company_name.lower()
    # Chọn entity type theo domain
    entity_type = (
        "AGENCY" if domain in ("SALES_MARKETING", "MARKETING", "SALES") else "COMPANY"
    )

    # Ưu tiên: dữ liệu từ backend
    dynamic_lookup = kb_loader.get_lookup_by_type(entity_type)
    if dynamic_lookup:
        for keyword, rank in dynamic_lookup.items():
            if keyword in name_lower or name_lower in keyword:
                return (rank, RANK_SCORE_MAP.get(rank, 0.0))
        return ("UNKNOWN", 0.0)

    # Fallback: hardcode
    hardcode_lookup = AGENCIES if entity_type == "AGENCY" else TECH_COMPANIES
    for keyword, rank in hardcode_lookup.items():
        if keyword in name_lower:
            return (rank, RANK_SCORE_MAP[rank])

    return ("UNKNOWN", 0.0)


def get_rank_score(rank: str) -> float:
    """Trả về hệ số điểm cho một rank string."""
    return RANK_SCORE_MAP.get(rank, 0.0)
