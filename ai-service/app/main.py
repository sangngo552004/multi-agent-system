"""FastAPI application for the CV extraction service.

Provides REST endpoints for CV extraction and health checks,
plus optional RabbitMQ consumer for async processing.
"""

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.agents.career_path_agent.agent import career_path_agent
from app.agents.extractor_agent import ner_extractor
from app.agents.matcher_agent import kb_loader
from app.core.config import settings
from app.core.schemas import (
    ApiErrorResponse,
    CareerPathOutput,
    CareerPathRequest,
    CVExtractionResponse,
)

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

    # Eager-load Knowledge Base from backend
    # KB được cache vào memory ngay khi startup — không lazy-load mỗi request.
    # Nếu backend chưa sẵn sàng → log warning, fallback về hardcode.
    try:
        kb_loader.warmup_kb()
    except Exception as e:
        logger.warning("KB warmup failed (%s). Will fallback to hardcoded KB.", e)

    # Start RabbitMQ consumer if enabled
    consumer_thread = None
    if settings.RABBITMQ_ENABLED:
        try:
            from app.rabbitmq.consumer import start_consumer_thread

            consumer_thread = start_consumer_thread()
            logger.info("RabbitMQ consumer started.")
        except Exception as e:
            logger.error("Failed to start RabbitMQ consumer: %s", e)

    # Initialize LangGraph Checkpointer (Memory or Postgres)
    try:
        from app.agents.orchestrator import init_checkpointer

        await init_checkpointer()
    except Exception as e:
        logger.warning("Checkpointer initialization warning: %s", e)

    yield

    # Shutdown
    logger.info("Shutting down AI Service...")
    try:
        from app.agents.orchestrator import close_checkpointer

        await close_checkpointer()
    except Exception as e:
        logger.warning("Error closing checkpointer pool: %s", e)

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


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    import time

    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = int((time.perf_counter() - start_time) * 1000)
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)
    return response


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
        "checkpointer_type": settings.CHECKPOINTER_TYPE,
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
        "checkpointer_type": settings.CHECKPOINTER_TYPE,
        "tracing_enabled": settings.LANGCHAIN_TRACING_V2,
        "metrics_logging_enabled": settings.ENABLE_METRICS_LOGGING,
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
    from app.agents.extractor_agent import agent as cv_pipeline

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
        ) from e

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


@app.post(
    "/process-application",
    summary="Process a full application (Extract CV -> Match -> Path)",
    description="Upload CV and Job Data to trigger the LangGraph multi-agent flow.",
)
async def process_application(
    job_data_json: str = Form(..., description="Job data in JSON string format"),
    hr_preferences: str = Form("", description="Hidden HR preferences"),
    file: UploadFile = File(...),
):
    import json

    from app.agents.orchestrator import build_graph

    try:
        job_data = json.loads(job_data_json)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400, detail="job_data_json must be valid JSON"
        ) from e

    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}") from e

    initial_state = {
        "application_id": file.filename or "unknown",
        "file_content": file_content,
        "filename": file.filename or "unknown",
        "job_data": job_data,
        "hr_preferences": hr_preferences,
        "cv_data": None,
        "match_result": None,
        "career_path_result": None,
        "needs_human_review": False,
    }

    # Compile graph with active checkpointer (MemorySaver in dev, AsyncPostgresSaver in prod)
    graph = build_graph()
    config = {"configurable": {"thread_id": file.filename or "default_thread"}}
    try:
        final_state = await graph.ainvoke(initial_state, config)
        return {
            "application_id": final_state["application_id"],
            "needs_human_review": final_state["needs_human_review"],
            "match_result": final_state["match_result"],
            "cv_data": final_state["cv_data"],
            "career_path_result": final_state.get("career_path_result"),
            "telemetry": final_state.get("telemetry"),
        }
    except Exception as e:
        logger.error(f"Graph execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Graph failed: {e}") from e


@app.post(
    "/generate-career-path",
    response_model=CareerPathOutput,
    responses={
        422: {
            "model": ApiErrorResponse,
            "description": "Request payload validation failed",
        },
        500: {
            "model": ApiErrorResponse,
            "description": "Unexpected Career Path service failure",
        },
    },
    summary="Generate a decision-gated candidate career path",
    description=(
        "Internal service-to-service endpoint. The backend must assemble the "
        "final decision and sanitized immutable snapshots."
    ),
)
async def generate_career_path(
    request: CareerPathRequest,
) -> CareerPathOutput | JSONResponse:
    """Generate a Career Path domain result without exposing internal failures."""

    logger.info(
        "Career Path request application_id=%s decision_id=%s",
        request.application_id,
        request.decision.decision_id,
    )
    try:
        output = await career_path_agent.generate(request)
    except Exception:
        logger.error(
            "Career Path endpoint failed application_id=%s",
            request.application_id,
        )
        error = ApiErrorResponse(
            error_code="CAREER_PATH_INTERNAL_ERROR",
            message="Unable to generate career path.",
        )
        return JSONResponse(
            status_code=500,
            content=error.model_dump(mode="json"),
        )

    logger.info(
        "Career Path result application_id=%s status=%s delivery_status=%s phases=%d",
        request.application_id,
        output.status.value,
        output.delivery_status.value,
        len(output.internal_draft.phases) if output.internal_draft else 0,
    )
    return output


# ── Error handlers ─────────────────────────────────────────────────


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    """Avoid echoing rejected request values, which may contain recruitment PII."""
    logger.warning(
        "Request validation failed path=%s error_count=%d",
        request.url.path,
        len(exc.errors()),
    )
    error = ApiErrorResponse(
        error_code="REQUEST_VALIDATION_ERROR",
        message="Request payload is invalid.",
    )
    return JSONResponse(
        status_code=422,
        content=error.model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return a generic non-domain-specific error without leaking exception data."""
    logger.error("Unhandled request failure path=%s", request.url.path)
    error = ApiErrorResponse(
        error_code="INTERNAL_SERVER_ERROR",
        message="The service could not complete the request.",
    )
    return JSONResponse(
        status_code=500,
        content=error.model_dump(mode="json"),
    )


# ── Entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.getenv("HOST", settings.HOST)
    port = int(os.getenv("PORT", str(settings.PORT)))
    uvicorn.run(app, host=host, port=port)
