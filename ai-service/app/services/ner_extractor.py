"""NER extraction service using various models (Strategy Pattern).

Supports multiple extraction strategies (Transformers, GLiNER, etc.).
Configured via settings.NER_EXTRACTOR_TYPE.
"""

import logging
import re
from abc import ABC, abstractmethod
from typing import Optional

from app.config import settings
from app.schemas import NEREntity

logger = logging.getLogger(__name__)

_EXTRACTOR_REGISTRY: dict[str, type["BaseNERExtractor"]] = {}

def register_extractor(name: str):
    """Decorator to register a new NER extractor."""
    def decorator(cls: type["BaseNERExtractor"]):
        _EXTRACTOR_REGISTRY[name] = cls
        return cls
    return decorator



class BaseNERExtractor(ABC):
    """Abstract base class for NER extractors."""

    @abstractmethod
    def load_model(self) -> None:
        """Load the NER model into memory."""
        pass

    @abstractmethod
    def is_model_loaded(self) -> bool:
        """Check if the NER model is loaded and ready."""
        pass

    @abstractmethod
    def extract_entities(self, text: str) -> list[NEREntity]:
        """Extract named entities from CV text."""
        pass


@register_extractor("transformers")
class TransformersNERExtractor(BaseNERExtractor):
    """NER extraction using HuggingFace transformers (BERT-like models)."""

    LABEL_MAPPING = {
        "Name": "name",
        "Email Address": "email",
        "Phone": "phone",
        "Location": "location",
        "Skills": "skills",
        "Companies worked at": "company",
        "Designation": "title",
        "Years of Experience": "duration",
        "College Name": "institution",
        "Degree": "degree",
        "Graduation Year": "year",
    }

    def __init__(self):
        self._ner_pipeline = None
        self._tokenizer = None

    def load_model(self) -> None:
        if self._ner_pipeline is not None:
            logger.info("Transformers NER model already loaded, skipping.")
            return

        logger.info("Loading Transformers NER model: %s ...", settings.NER_MODEL_NAME)

        from transformers import (
            AutoTokenizer,
            pipeline,
        )

        self._tokenizer = AutoTokenizer.from_pretrained(settings.NER_MODEL_NAME)
        self._ner_pipeline = pipeline(
            "ner",
            model=settings.NER_MODEL_NAME,
            tokenizer=self._tokenizer,
            aggregation_strategy="simple",
        )

        logger.info("Transformers NER model loaded successfully.")

    def is_model_loaded(self) -> bool:
        return self._ner_pipeline is not None

    def extract_entities(self, text: str) -> list[NEREntity]:
        if not text or not text.strip():
            return []

        if self._ner_pipeline is None or self._tokenizer is None:
            raise RuntimeError(
                "Transformers NER model not loaded. Call load_model() first."
            )

        tokens = self._tokenizer.encode(text, add_special_tokens=False)
        token_count = len(tokens)

        logger.info("Input text: %d chars, %d tokens", len(text), token_count)

        if token_count <= settings.NER_MAX_TOKENS:
            raw_entities = self._run_ner(text)
            entities = self._convert_entities(raw_entities, offset=0)
        else:
            chunks = self._create_chunks(text)
            logger.info("Text split into %d chunks for NER", len(chunks))
            entities = self._process_chunks(chunks)

        for entity in entities:
            if entity.score < settings.CONFIDENCE_THRESHOLD:
                entity.low_confidence = True

        entities = self._deduplicate_entities(entities)

        logger.info(
            "NER extraction complete: %d entities, %d low-confidence",
            len(entities),
            sum(1 for e in entities if e.low_confidence),
        )

        return entities

    def _run_ner(self, text: str) -> list[dict]:
        try:
            results = self._ner_pipeline(text)
            return results if results else []
        except Exception as e:
            logger.error("NER pipeline error: %s", e)
            return []

    def _create_chunks(self, text: str) -> list[tuple[str, int]]:
        sentences = self._split_into_sentences(text)

        chunks: list[tuple[str, int]] = []
        current_chunk_sentences: list[str] = []
        current_chunk_tokens = 0
        current_offset = 0
        chunk_start_offset = 0

        for sentence in sentences:
            sentence_tokens = len(
                self._tokenizer.encode(sentence, add_special_tokens=False)
            )

            if (
                current_chunk_tokens + sentence_tokens > settings.NER_MAX_TOKENS
                and current_chunk_sentences
            ):
                chunk_text = " ".join(current_chunk_sentences)
                chunks.append((chunk_text, chunk_start_offset))

                overlap_sentences = []
                overlap_tokens = 0
                for s in reversed(current_chunk_sentences):
                    s_tokens = len(
                        self._tokenizer.encode(s, add_special_tokens=False)
                    )
                    if overlap_tokens + s_tokens > settings.NER_OVERLAP_TOKENS:
                        break
                    overlap_sentences.insert(0, s)
                    overlap_tokens += s_tokens

                if overlap_sentences:
                    overlap_text = " ".join(overlap_sentences)
                    chunk_start_offset = (
                        current_offset - len(overlap_text) - len(sentence)
                    )
                else:
                    chunk_start_offset = current_offset

                current_chunk_sentences = overlap_sentences + [sentence]
                current_chunk_tokens = overlap_tokens + sentence_tokens
            else:
                if not current_chunk_sentences:
                    chunk_start_offset = current_offset
                current_chunk_sentences.append(sentence)
                current_chunk_tokens += sentence_tokens

            current_offset += len(sentence) + 1

        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            chunks.append((chunk_text, chunk_start_offset))

        return chunks

    def _split_into_sentences(self, text: str) -> list[str]:
        raw_sentences = re.split(r"(?<=[.!?\n])\s+", text)
        return [s.strip() for s in raw_sentences if s.strip()]

    def _process_chunks(
        self,
        chunks: list[tuple[str, int]],
    ) -> list[NEREntity]:
        all_entities: list[NEREntity] = []

        for chunk_idx, (chunk_text, char_offset) in enumerate(chunks):
            logger.debug(
                "Processing chunk %d/%d (offset=%d, len=%d)",
                chunk_idx + 1,
                len(chunks),
                char_offset,
                len(chunk_text),
            )

            raw_entities = self._run_ner(chunk_text)
            entities = self._convert_entities(raw_entities, offset=char_offset)
            all_entities.extend(entities)

        all_entities = self._resolve_overlaps(all_entities)

        return all_entities

    def _convert_entities(
        self, raw_entities: list[dict], offset: int
    ) -> list[NEREntity]:
        entities = []
        for raw in raw_entities:
            label = raw.get("entity_group", raw.get("entity", "UNKNOWN"))
            label = re.sub(r"^[BI]-", "", label)
            mapped_label = self.LABEL_MAPPING.get(label, "UNKNOWN")

            if mapped_label == "UNKNOWN":
                continue

            entity = NEREntity(
                text=raw.get("word", "").strip(),
                label=mapped_label,
                score=float(raw.get("score", 0.0)),
                start=int(raw.get("start", 0)) + offset,
                end=int(raw.get("end", 0)) + offset,
            )

            if entity.text and len(entity.text) > 0:
                entities.append(entity)

        return entities

    def _resolve_overlaps(self, entities: list[NEREntity]) -> list[NEREntity]:
        if not entities:
            return []

        entities.sort(key=lambda e: (e.start, -e.score))

        resolved: list[NEREntity] = []
        for entity in entities:
            overlaps = False
            for existing in resolved:
                if self._spans_overlap(entity.start, entity.end, existing.start, existing.end):
                    overlaps = True
                    if entity.score > existing.score:
                        resolved.remove(existing)
                        resolved.append(entity)
                    break

            if not overlaps:
                resolved.append(entity)

        return resolved

    def _spans_overlap(self, s1: int, e1: int, s2: int, e2: int) -> bool:
        return s1 < e2 and s2 < e1

    def _deduplicate_entities(self, entities: list[NEREntity]) -> list[NEREntity]:
        seen: set[tuple[str, str]] = set()
        unique: list[NEREntity] = []

        for entity in entities:
            key = (entity.text.lower().strip(), entity.label)
            if key not in seen:
                seen.add(key)
                unique.append(entity)

        return unique


# ── GLiNER Extractor ──────────────────────────────────────────────────────

@register_extractor("gliner")
class GlinerNERExtractor(BaseNERExtractor):
    """NER extraction using GLiNER (Zero-shot Named Entity Recognition)."""

    def __init__(self):
        self._model = None
        
        # GLiNER works best with highly descriptive labels. 
        # We define descriptive labels for prediction and map them back to our standard keys.
        self.label_mapping = {
            "Person Name": "name",
            "Email Address": "email",
            "Phone Number": "phone",
            "Location or Address": "location",
            "Technical Skills": "skills",
            "Company Name": "company",
            "Job Title": "title",
            "Time Duration": "duration",
            "University or College": "institution",
            "Academic Degree": "degree",
            "Graduation Year": "year"
        }
        self.gliner_labels = list(self.label_mapping.keys())

    def load_model(self) -> None:
        if self._model is not None:
            logger.info("GLiNER model already loaded, skipping.")
            return

        logger.info("Loading GLiNER model: %s ...", settings.GLINER_MODEL_NAME)
        
        try:
            from gliner import GLiNER
            self._model = GLiNER.from_pretrained(settings.GLINER_MODEL_NAME)
            logger.info("GLiNER model loaded successfully.")
        except ImportError:
            logger.error("gliner package not installed. Please run: pip install gliner")
            raise
        except Exception as e:
            logger.error("Failed to load GLiNER model: %s", e)
            raise

    def is_model_loaded(self) -> bool:
        return self._model is not None

    def extract_entities(self, text: str) -> list[NEREntity]:
        if not text or not text.strip():
            return []

        if self._model is None:
            raise RuntimeError(
                "GLiNER model not loaded. Call load_model() first."
            )

        logger.info("Extracting entities with GLiNER (%d chars)", len(text))
        
        try:
            # Predict entities using highly descriptive labels
            raw_entities = self._model.predict_entities(
                text, 
                self.gliner_labels, 
                threshold=settings.CONFIDENCE_THRESHOLD
            )
        except Exception as e:
            logger.error("GLiNER prediction error: %s", e)
            return []

        entities = []
        for raw in raw_entities:
            gliner_label = raw.get("label", "")
            standard_label = self.label_mapping.get(gliner_label, "UNKNOWN")
            
            if standard_label == "UNKNOWN":
                continue
                
            entity = NEREntity(
                text=raw.get("text", "").strip(),
                label=standard_label,
                score=float(raw.get("score", 0.0)),
                start=int(raw.get("start", 0)),
                end=int(raw.get("end", 0)),
            )
            
            # Since GLiNER accepts a threshold, all returned entities are >= threshold.
            # But we can still flag them if they are close to the threshold.
            if entity.score < (settings.CONFIDENCE_THRESHOLD + 0.1):
                entity.low_confidence = True

            if entity.text:
                entities.append(entity)

        # Remove duplicates
        seen = set()
        unique_entities = []
        for e in entities:
            key = (e.text.lower().strip(), e.label)
            if key not in seen:
                seen.add(key)
                unique_entities.append(e)

        logger.info(
            "GLiNER extraction complete: %d entities",
            len(unique_entities)
        )

        return unique_entities


# ── Extractor Factory ──────────────────────────────────────────────────

def get_extractor(extractor_type: str) -> BaseNERExtractor:
    """Factory to get the configured NER extractor."""
    cls = _EXTRACTOR_REGISTRY.get(extractor_type)
    if cls is None:
        raise ValueError(f"Unknown NER_EXTRACTOR_TYPE: {extractor_type}. Available: {list(_EXTRACTOR_REGISTRY.keys())}")
    return cls()


# ── Module-level API (preserves backwards compatibility) ──────────────

_extractor_instance: Optional[BaseNERExtractor] = None

def _get_instance() -> BaseNERExtractor:
    """Get or create the singleton extractor instance."""
    global _extractor_instance
    if _extractor_instance is None:
        extractor_type = getattr(settings, "NER_EXTRACTOR_TYPE", "transformers")
        _extractor_instance = get_extractor(extractor_type)
    return _extractor_instance

def load_model() -> None:
    """Load the configured NER model into memory."""
    _get_instance().load_model()

def is_model_loaded() -> bool:
    """Check if the configured NER model is loaded."""
    return _get_instance().is_model_loaded()

def extract_entities(text: str) -> list[NEREntity]:
    """Extract named entities from CV text using the configured model."""
    return _get_instance().extract_entities(text)
