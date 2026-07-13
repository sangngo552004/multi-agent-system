"""FastAPI application for the CV extraction service.

Provides REST endpoints for CV extraction and health checks,
plus optional RabbitMQ consumer for async processing.
"""

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.schemas import CVExtractionResponse, ExtractionStatus
from app.services import cv_pipeline, ner_extractor

logger = logging.getLogger(__name__)


# ── Logging setup ──────────────────────────────────────────────────

def _setup_logging():
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# ── Lifespan ───────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load model on startup, cleanup on shutdown."""
    _setup_logging()
    logger.info("Starting AI Service...")

    # Load NER model (one-time, blocking)
    try:
        ner_extractor.load_model()
        logger.info("NER model loaded successfully.")
    except Exception as e:
        logger.error("Failed to load NER model: %s", e)
        # Service starts but model endpoints will fail gracefully

    # Start RabbitMQ consumer if enabled
    consumer_thread = None
    if settings.RABBITMQ_ENABLED:
        try:
            from app.rabbitmq.consumer import start_consumer_thread

            consumer_thread = start_consumer_thread()
            logger.info("RabbitMQ consumer started.")
        except Exception as e:
            logger.error("Failed to start RabbitMQ consumer: %s", e)

    yield

    # Shutdown
    logger.info("Shutting down AI Service...")
    if consumer_thread and consumer_thread.is_alive():
        logger.info("Stopping RabbitMQ consumer...")


# ── FastAPI App ────────────────────────────────────────────────────

app = FastAPI(
    title="TTTN AI Service - CV Extraction",
    description=(
        "Extracts structured information from CV/Resume files (PDF/DOCX) "
        "using NER model with LLM fallback for Vietnamese CVs."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "AI Service is running"}


@app.get("/health")
def health_check():
    """Basic health check."""
    model_loaded = ner_extractor.is_model_loaded()
    status = "healthy" if model_loaded else "degraded"
    return {
        "status": status,
        "model_loaded": model_loaded,
        "service": "ai-service",
        "version": "1.0.0",
    }


@app.get("/health/model")
def model_health():
    """Detailed model health check."""
    return {
        "model_name": settings.NER_MODEL_NAME,
        "model_loaded": ner_extractor.is_model_loaded(),
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "max_page_count": settings.MAX_PAGE_COUNT,
        "llm_fallback_configured": bool(settings.GOOGLE_API_KEY),
        "llm_model": settings.LLM_MODEL_NAME,
        "rabbitmq_enabled": settings.RABBITMQ_ENABLED,
    }


@app.post(
    "/extract-cv",
    response_model=CVExtractionResponse,
    summary="Extract structured data from a CV file",
    description=(
        "Upload a PDF or DOCX CV file. Returns extracted personal info, "
        "skills, experience, and education in structured JSON format."
    ),
)
async def extract_cv(
    file: UploadFile = File(
        ...,
        description="CV file in PDF or DOCX format (max 10MB)",
    ),
) -> CVExtractionResponse:
    """Extract structured information from an uploaded CV file."""
    filename = file.filename or "unknown"

    logger.info(
        "Received CV extraction request: filename=%s, content_type=%s",
        filename,
        file.content_type,
    )

    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded file: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # Run pipeline
    response = await cv_pipeline.process_cv(file_content, filename)

    # Log result summary
    logger.info(
        "CV extraction result: filename=%s, status=%s, method=%s, "
        "warnings=%d, time=%dms",
        filename,
        response.status.value,
        response.extraction_method.value,
        len(response.warnings),
        response.processing_log.processing_time_ms,
    )

    return response


# ── Error handlers ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all exception handler to prevent 500 errors without context."""
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "failed",
            "extraction_method": "ner_model",
            "language_detected": "unknown",
            "personal_info": {"name": None, "email": None, "phone": None, "location": None},
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "confidence_scores": {"overall": 0.0, "per_field": {}},
            "warnings": [f"internal_server_error: {str(exc)}"],
            "processing_log": {
                "extraction_method": "",
                "ocr_used": False,
                "fallback_reason": None,
                "processing_time_ms": 0,
                "text_extraction_method": "",
            },
        },
    )


# ── Entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.getenv("HOST", settings.HOST)
    port = int(os.getenv("PORT", str(settings.PORT)))
    uvicorn.run(app, host=host, port=port)
