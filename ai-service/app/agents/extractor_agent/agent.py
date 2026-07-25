"""CV extraction pipeline orchestrator.

Coordinates the full extraction flow:
1. File validation
2. Text extraction (with OCR fallback)
3. Language detection (simple)
4. LLM Extraction (Personal info, etc.)
5. LLM Enrichment (Experience, Projects, etc.)
"""

import asyncio
import logging
import time

from app.agents.extractor_agent import (
    file_validator,
    llm_enricher,
    llm_fallback,
    text_extractor,
)
from app.core.config import settings
from app.core.schemas import (
    CVExtractionResponse,
    DetectedLanguage,
    ExtractionStatus,
    ProcessingLog,
)

logger = logging.getLogger(__name__)

async def process_cv(
    file_content: bytes,
    filename: str,
) -> CVExtractionResponse:
    """Process a CV file through the LLM extraction pipeline."""
    start_time = time.time()
    warnings: list[str] = []

    # ── Step 1: Validate file ─────────────────────────────────────
    logger.info("Step 1: Validating file '%s' (%d bytes)", filename, len(file_content))
    loop = asyncio.get_running_loop()
    validation = await loop.run_in_executor(
        None, file_validator.validate_file, file_content, filename
    )
    if not validation.is_valid:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return CVExtractionResponse(
            status=ExtractionStatus.FAILED,
            warnings=validation.errors,
            processing_log=ProcessingLog(processing_time_ms=elapsed_ms),
        )
    warnings.extend(validation.warnings)
    mime_type = validation.file_info.mime_type

    # ── Step 2: Extract text ──────────────────────────────────────
    logger.info("Step 2: Extracting text (mime=%s)", mime_type)
    try:
        text_result = await loop.run_in_executor(
            None, text_extractor.extract_text, file_content, mime_type
        )
    except Exception as e:
        logger.error("Text extraction crashed: %s", e)
        elapsed_ms = int((time.time() - start_time) * 1000)
        return CVExtractionResponse(
            status=ExtractionStatus.FAILED,
            warnings=[f"text_extraction_failed: {str(e)}"],
            processing_log=ProcessingLog(processing_time_ms=elapsed_ms),
        )

    if not text_result.text or len(text_result.text.strip()) < settings.MIN_TEXT_LENGTH:
        logger.warning("Text too short (%d chars).", len(text_result.text) if text_result.text else 0)
        logger.info("Attempting LLM extraction despite short text...")
        llm_response = await llm_fallback.llm_extract_cv(text_result.text or "", "text_too_short")
        if llm_response:
            llm_response.warnings.extend(warnings)
            llm_response.warnings.append("possible_scanned_file")
            return llm_response
            
        elapsed_ms = int((time.time() - start_time) * 1000)
        return CVExtractionResponse(
            status=ExtractionStatus.FAILED,
            warnings=warnings + text_result.warnings + ["text_extraction_insufficient"],
            processing_log=ProcessingLog(
                processing_time_ms=elapsed_ms,
                ocr_used=text_result.ocr_used,
                text_extraction_method=text_result.method,
            ),
        )

    # ── Step 3: Detect language (simple) ──────────────────────────
    logger.info("Step 3: Detecting language")
    detected_lang = await loop.run_in_executor(None, _detect_language_simple, text_result.text)

    # ── Step 4: LLM Extraction ────────────────────────────────────
    logger.info("Step 4: Running primary LLM extraction")
    llm_response = await llm_fallback.llm_extract_cv(
        text_result.text,
        "primary_llm_extraction",
    )

    if not llm_response:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return CVExtractionResponse(
            status=ExtractionStatus.FAILED,
            warnings=warnings + ["llm_extraction_failed"],
            processing_log=ProcessingLog(
                processing_time_ms=elapsed_ms,
                ocr_used=text_result.ocr_used,
                text_extraction_method=text_result.method,
            ),
        )

    llm_response.language_detected = detected_lang
    llm_response.warnings.extend(warnings)
    llm_response.processing_log.ocr_used = text_result.ocr_used
    llm_response.processing_log.text_extraction_method = text_result.method

    # ── Step 5: LLM Enrichment ────────────────────────────────────
    logger.info("Step 5: Running LLM enrichment for detailed info")
    try:
        enriched_experience, enriched_projects, enriched_skills, enriched_education = (
            await llm_enricher.enrich_experience_and_projects(text_result.text)
        )
        
        if enriched_experience:
            from app.core.schemas import ExperienceItem
            llm_response.experience = [
                ExperienceItem(**exp) for exp in enriched_experience
            ]
        if enriched_projects:
            from app.core.schemas import ProjectItem
            llm_response.projects = [
                ProjectItem(**proj) for proj in enriched_projects
            ]
        if enriched_skills:
            llm_response.skills = enriched_skills
        if enriched_education:
            from app.core.schemas import EducationItem
            llm_response.education = [
                EducationItem(**edu) for edu in enriched_education
            ]
            
    except Exception as enrich_err:
        logger.warning("LLM enrichment step failed: %s", enrich_err)
        llm_response.warnings.append("llm_enrichment_failed")

    elapsed_ms = int((time.time() - start_time) * 1000)
    llm_response.processing_log.processing_time_ms = elapsed_ms
    
    logger.info(
        "CV extraction complete: status=%s, method=%s, time=%dms",
        llm_response.status.value,
        llm_response.extraction_method.value,
        elapsed_ms,
    )

    return llm_response


def _detect_language_simple(text: str) -> DetectedLanguage:
    """Simple language detection using langdetect."""
    if not text or len(text) < 50:
        return DetectedLanguage.UNKNOWN

    try:
        from langdetect import detect

        lang = detect(text)
        if lang == "vi":
            return DetectedLanguage.VI
        elif lang == "en":
            return DetectedLanguage.EN
        else:
            return DetectedLanguage.UNKNOWN
    except Exception:
        return DetectedLanguage.UNKNOWN
