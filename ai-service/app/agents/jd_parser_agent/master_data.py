import logging
import time
from typing import Any, Dict, List

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_job_families: List[Dict[str, Any]] = []
_career_levels: List[Dict[str, Any]] = []
_competencies: List[Dict[str, Any]] = []
_rules: List[Dict[str, Any]] = []
_cache_loaded_at: float = 0.0


def _is_cache_stale() -> bool:
    return (time.time() - _cache_loaded_at) > settings.KB_CACHE_TTL_SECONDS


def get_job_families() -> List[Dict[str, Any]]:
    _ensure_loaded()
    return _job_families


def get_career_levels() -> List[Dict[str, Any]]:
    _ensure_loaded()
    return _career_levels


def get_competencies() -> List[Dict[str, Any]]:
    _ensure_loaded()
    return _competencies


def get_rules() -> List[Dict[str, Any]]:
    _ensure_loaded()
    return _rules


def warmup_master_data():
    logger.info("Warming up JD Parser Master Data...")
    _load_raw(force=True)


def _ensure_loaded():
    if not _job_families or _is_cache_stale():
        _load_raw()


def _load_raw(force: bool = False):
    global _job_families, _career_levels, _competencies, _rules, _cache_loaded_at

    if not force and _job_families and not _is_cache_stale():
        return

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{settings.BACKEND_BASE_URL}/api/v1/ai/master-data")
            response.raise_for_status()
            data = response.json().get("result", {})
            _job_families = data.get("jobFamilies", [])
            _career_levels = data.get("careerLevels", [])
            _competencies = data.get("competencies", [])
            _rules = data.get("rules", [])

        _cache_loaded_at = time.time()
        logger.info(
            f"Loaded Master Data: {_job_families.__len__()} JobFamilies, {_career_levels.__len__()} CareerLevels, {_competencies.__len__()} Competencies"
        )
    except Exception as e:
        logger.warning(f"Failed to load Master Data for JD Parser: {e}")
