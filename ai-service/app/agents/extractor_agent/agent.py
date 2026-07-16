"""CV extraction pipeline orchestrator.

Coordinates the full extraction flow:
1. File validation
2. Text extraction (with OCR fallback)
3. Language detection (simple)
4. NER extraction
5. Quality evaluation & LLM fallback
6. Output normalization
"""

import asyncio
import logging
import re
import time
from typing import Optional

from app.agents.extractor_agent import (
    file_validator,
    llm_fallback,
    ner_extractor,
    text_extractor,
)
from app.core.config import settings
from app.core.schemas import (
    ConfidenceScores,
    CVExtractionResponse,
    DetectedLanguage,
    EducationItem,
    ExperienceItem,
    ExtractionMethod,
    ExtractionStatus,
    NEREntity,
    PersonalInfo,
    ProcessingLog,
    TextExtractionResult,
)

logger = logging.getLogger(__name__)

# Regex patterns for validation
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")


async def process_cv(
    file_content: bytes,
    filename: str,
) -> CVExtractionResponse:
    """Process a CV file through the full extraction pipeline.

    Args:
        file_content: Raw bytes of the uploaded file.
        filename: Original filename.

    Returns:
        CVExtractionResponse with extracted data, status, and warnings.
    """
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
            processing_log=ProcessingLog(
                processing_time_ms=elapsed_ms,
            ),
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
        logger.warning(
            "Text too short (%d chars).",
            len(text_result.text) if text_result.text else 0,
        )
        if settings.EXTRACTION_STRATEGY != "ner":
            logger.info("Attempting LLM fallback...")
            llm_response = await _try_llm_fallback(
                text_result.text or "",
                "text_too_short",
                start_time,
            )
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
    detected_lang = await loop.run_in_executor(
        None, _detect_language_simple, text_result.text
    )

    # ── Step 4: Extraction Strategy ───────────────────────────────
    logger.info("Step 4: Running extraction strategy: %s", settings.EXTRACTION_STRATEGY)

    entities = []

    if settings.EXTRACTION_STRATEGY == "llm":
        logger.info("Strategy is LLM only. Bypassing NER.")
        llm_response = await _try_llm_fallback(
            text_result.text,
            "strategy_llm_only",
            start_time,
        )
        if llm_response:
            llm_response.language_detected = detected_lang
            llm_response.warnings.extend(warnings)
            llm_response.processing_log.ocr_used = text_result.ocr_used
            llm_response.processing_log.text_extraction_method = text_result.method
            return llm_response
        else:
            warnings.append("llm_extraction_failed")
    else:
        # Strategy is "ner" or "hybrid"
        try:
            entities = await loop.run_in_executor(
                None, ner_extractor.extract_entities, text_result.text
            )
        except Exception as e:
            logger.error("NER extraction failed: %s", e)
            warnings.append(f"ner_extraction_error: {str(e)}")

        # ── Step 5: Evaluate quality & decide fallback ────────────────
        if settings.EXTRACTION_STRATEGY == "hybrid":
            logger.info(
                "Step 5: Evaluating NER quality (%d entities) for hybrid strategy",
                len(entities),
            )

            fallback_reason = _evaluate_fallback_need(
                entities, detected_lang, text_result
            )

            if fallback_reason:
                logger.info("LLM fallback triggered: %s", fallback_reason)

                llm_response = await _try_llm_fallback(
                    text_result.text,
                    fallback_reason,
                    start_time,
                )

                if llm_response:
                    llm_response.language_detected = detected_lang
                    llm_response.warnings.extend(warnings)
                    llm_response.processing_log.ocr_used = text_result.ocr_used
                    llm_response.processing_log.text_extraction_method = (
                        text_result.method
                    )
                    return llm_response
                else:
                    warnings.append("llm_fallback_failed")

    # ── Step 6: Normalize output ──────────────────────────────────
    logger.info("Step 6: Normalizing output")

    elapsed_ms = int((time.time() - start_time) * 1000)

    response = await loop.run_in_executor(
        None,
        _normalize_output,
        entities,
        text_result,
        detected_lang,
        elapsed_ms,
        warnings,
    )

    logger.info(
        "CV extraction complete: status=%s, method=%s, time=%dms",
        response.status.value,
        response.extraction_method.value,
        elapsed_ms,
    )

    return response


# ── Language detection (simple, inlined) ──────────────────────────────


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


# ── Fallback evaluation ───────────────────────────────────────────────


def _evaluate_fallback_need(
    entities: list,
    detected_lang: DetectedLanguage,
    text_result: TextExtractionResult,
) -> Optional[str]:
    """Evaluate whether LLM fallback is needed."""
    entity_labels = {e.label for e in entities}

    has_name = "name" in entity_labels
    has_email = "email" in entity_labels

    # Missing required fields (name AND email both absent)
    if not has_name and not has_email:
        return "missing_required_fields"

    # Vietnamese CV + low NER confidence
    if detected_lang == DetectedLanguage.VI:
        if entities:
            avg_confidence = sum(e.score for e in entities) / len(entities)
            if avg_confidence < 0.5:
                return "vietnamese_low_confidence"
        else:
            return "vietnamese_no_entities"

    return None


# ── Output normalization (inlined from output_normalizer.py) ──────────


def _normalize_output(
    entities: list[NEREntity],
    text_result: TextExtractionResult,
    detected_lang: DetectedLanguage,
    processing_time_ms: int = 0,
    extra_warnings: Optional[list[str]] = None,
) -> CVExtractionResponse:
    """Normalize NER entities into structured CV output."""
    warnings: list[str] = list(extra_warnings or [])
    warnings.extend(text_result.warnings)

    # Group entities by label
    grouped = _group_entities_by_label(entities)

    # Extract fields
    personal_info = _extract_personal_info(grouped, warnings, text_result)
    skills = _extract_skills(grouped)
    experience = _extract_experience(grouped)
    education = _extract_education(grouped)
    confidence = _calculate_confidence(entities, grouped)
    status = _determine_status(personal_info, skills, experience, entities, warnings)

    # Add confidence warnings
    _add_confidence_warnings(entities, warnings)

    processing_log = ProcessingLog(
        extraction_method=ExtractionMethod.NER_MODEL.value,
        ocr_used=text_result.ocr_used,
        processing_time_ms=processing_time_ms,
        text_extraction_method=text_result.method,
    )

    return CVExtractionResponse(
        status=status,
        extraction_method=ExtractionMethod.NER_MODEL,
        language_detected=detected_lang,
        personal_info=personal_info,
        skills=skills,
        experience=experience,
        education=education,
        certifications=[],
        confidence_scores=confidence,
        warnings=warnings,
        processing_log=processing_log,
    )


def _group_entities_by_label(
    entities: list[NEREntity],
) -> dict[str, list[NEREntity]]:
    """Group entities by their NER label."""
    grouped: dict[str, list[NEREntity]] = {}
    for entity in entities:
        label = entity.label
        if label not in grouped:
            grouped[label] = []
        grouped[label].append(entity)
    return grouped


def _extract_personal_info(
    grouped: dict[str, list[NEREntity]],
    warnings: list[str],
    text_result: Optional[TextExtractionResult] = None,
) -> PersonalInfo:
    """Extract personal information from grouped entities."""
    info = PersonalInfo()

    # Name
    names = grouped.get("name", [])
    if names:
        best_name = max(names, key=lambda e: e.score)
        info.name = best_name.text.strip()

    # Fallback: If NER missed the name (common for all-caps standalone names),
    # assume the first non-empty line of the CV is the name.
    if not info.name and text_result and text_result.text:
        lines = [line.strip() for line in text_result.text.split("\n") if line.strip()]
        if lines:
            # First line is highly likely to be the name
            potential_name = lines[0]
            # Basic validation: not too long, not an email/phone
            if len(potential_name) < 50 and "@" not in potential_name:
                info.name = potential_name
                warnings.append("name_extracted_via_fallback")

    # Email
    emails = grouped.get("email", [])
    if emails:
        for email_entity in emails:
            match = EMAIL_PATTERN.search(email_entity.text)
            if match:
                info.email = match.group()
                break
        if not info.email:
            info.email = emails[0].text.strip()
            warnings.append("email_format_uncertain")

    # Fallback for Email: Use Regex on raw text
    if not info.email and text_result and text_result.text:
        match = EMAIL_PATTERN.search(text_result.text)
        if match:
            info.email = match.group()
            warnings.append("email_extracted_via_regex")

    # Phone
    phones = grouped.get("phone", [])
    if phones:
        best_phone = max(phones, key=lambda e: e.score)
        phone_text = best_phone.text.strip()
        phone_clean = re.sub(r"[^\d+\-\s\(\)]", "", phone_text)
        info.phone = phone_clean if phone_clean else phone_text

    # Fallback for Phone: Use Regex on raw text
    if not info.phone and text_result and text_result.text:
        phone_match = re.search(r"(?:0|\+84)[\d\s\-\.]{9,12}", text_result.text)
        if phone_match:
            phone_text = phone_match.group()
            phone_clean = re.sub(r"[^\d+]", "", phone_text)
            if 9 <= len(phone_clean) <= 12:
                info.phone = phone_clean
                warnings.append("phone_extracted_via_regex")

    # Location
    locations = grouped.get("location", [])
    if locations:
        best_loc = max(locations, key=lambda e: e.score)
        info.location = best_loc.text.strip()

    return info


def _extract_skills(
    grouped: dict[str, list[NEREntity]],
) -> list[str]:
    """Extract unique skills from entities."""
    skills_entities = grouped.get("skills", [])
    seen: set[str] = set()
    skills: list[str] = []

    for entity in skills_entities:
        skill = entity.text.strip()
        skill_lower = skill.lower()
        if skill and skill_lower not in seen:
            seen.add(skill_lower)
            skills.append(skill)

    return skills


def _extract_experience(
    grouped: dict[str, list[NEREntity]],
) -> list[ExperienceItem]:
    """Extract work experience entries."""
    companies = grouped.get("company", [])
    titles = grouped.get("title", [])
    durations = grouped.get("duration", [])

    companies.sort(key=lambda e: e.start)
    titles.sort(key=lambda e: e.start)
    durations.sort(key=lambda e: e.start)

    max_entries = max(len(companies), len(titles), 1)
    experience: list[ExperienceItem] = []

    for i in range(max_entries):
        item = ExperienceItem()
        if i < len(companies):
            item.company = companies[i].text.strip()
        if i < len(titles):
            item.title = titles[i].text.strip()
        if i < len(durations):
            item.duration = durations[i].text.strip()

        if item.company or item.title or item.duration:
            experience.append(item)

    return experience


def _extract_education(
    grouped: dict[str, list[NEREntity]],
) -> list[EducationItem]:
    """Extract education entries."""
    colleges = grouped.get("institution", [])
    degrees = grouped.get("degree", [])
    years = grouped.get("year", [])

    colleges.sort(key=lambda e: e.start)
    degrees.sort(key=lambda e: e.start)
    years.sort(key=lambda e: e.start)

    max_entries = max(len(colleges), len(degrees), 1)
    education: list[EducationItem] = []

    for i in range(max_entries):
        item = EducationItem()
        if i < len(colleges):
            item.institution = colleges[i].text.strip()
        if i < len(degrees):
            item.degree = degrees[i].text.strip()
        if i < len(years):
            item.year = years[i].text.strip()

        if item.institution or item.degree or item.year:
            education.append(item)

    return education


def _calculate_confidence(
    entities: list[NEREntity],
    grouped: dict[str, list[NEREntity]],
) -> ConfidenceScores:
    """Calculate overall and per-field confidence scores."""
    if not entities:
        return ConfidenceScores(overall=0.0)

    overall = sum(e.score for e in entities) / len(entities)

    per_field: dict[str, float] = {}
    for label, ents in grouped.items():
        if ents:
            per_field[label] = sum(e.score for e in ents) / len(ents)

    return ConfidenceScores(overall=round(overall, 3), per_field=per_field)


def _determine_status(
    personal_info: PersonalInfo,
    skills: list[str],
    experience: list[ExperienceItem],
    entities: list[NEREntity],
    warnings: list[str],
) -> ExtractionStatus:
    """Determine extraction status based on completeness."""
    has_name = bool(personal_info.name)
    has_contact = bool(personal_info.email or personal_info.phone)
    has_skills = len(skills) > 0

    unique_labels = {e.label for e in entities}
    if len(unique_labels) < 3 and not has_name and not has_contact:
        warnings.append("document_may_not_be_a_cv")
        return ExtractionStatus.FAILED

    if has_name and has_contact and has_skills:
        return ExtractionStatus.SUCCESS

    if has_name or has_contact:
        if not has_name:
            warnings.append("missing_name")
        if not personal_info.email:
            warnings.append("missing_email")
        if not personal_info.phone:
            warnings.append("missing_phone")
        if not has_skills:
            warnings.append("missing_skills")
        return ExtractionStatus.PARTIAL

    warnings.append("insufficient_data_extracted")
    return ExtractionStatus.FAILED


def _add_confidence_warnings(
    entities: list[NEREntity],
    warnings: list[str],
) -> None:
    """Add warnings for low-confidence entities."""
    low_conf_labels: set[str] = set()
    for entity in entities:
        if entity.low_confidence:
            low_conf_labels.add(entity.label)

    for label in low_conf_labels:
        warnings.append(f"low_confidence_on_{label}")


async def _try_llm_fallback(
    text: str,
    reason: str,
    start_time: float,
) -> Optional[CVExtractionResponse]:
    """Attempt LLM fallback extraction."""
    try:
        response = await llm_fallback.llm_extract_cv(text, reason)
        if response:
            elapsed_ms = int((time.time() - start_time) * 1000)
            response.processing_log.processing_time_ms = elapsed_ms
            response.processing_log.fallback_reason = reason
        return response
    except Exception as e:
        logger.error("LLM fallback error: %s", e)
        return None
