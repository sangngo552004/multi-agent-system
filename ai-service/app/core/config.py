"""Application configuration using pydantic-settings."""

import os

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the CV extraction service.

    All values can be overridden via environment variables or .env file.
    """

    # --- Extraction Strategy ---
    EXTRACTION_STRATEGY: str = "llm"  # "hybrid", "ner", "llm"

    # --- NER Model ---
    NER_EXTRACTOR_TYPE: str = "gliner"  # "transformers", "gliner", etc.
    NER_MODEL_NAME: str = "yashpwr/resume-ner-bert-v2"
    GLINER_MODEL_NAME: str = "urchade/gliner_medium-v2.1"
    CONFIDENCE_THRESHOLD: float = 0.6
    NER_MAX_TOKENS: int = 450  # Buffer from model's 512 limit
    NER_OVERLAP_TOKENS: int = 50

    # --- File Validation ---
    MAX_FILE_SIZE_MB: int = 10
    MAX_PAGE_COUNT: int = 10
    WARN_PAGE_COUNT: int = 3
    MIN_TEXT_LENGTH: int = 50
    MIN_PRINTABLE_RATIO: float = 0.70

    # --- LLM Fallback ---
    GOOGLE_API_KEY: str = ""
    LLM_MODEL_NAME: str = "gemini-1.5-flash"
    LLM_DAILY_RATE_LIMIT: int = 100
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_MAX_RETRIES: int = 2

    # --- Career Path Agent ---
    CAREER_PATH_ENABLED: bool = False
    CAREER_PATH_TIMEOUT_SECONDS: int = Field(default=45, gt=0)
    CAREER_PATH_MAX_RETRIES: int = Field(default=1, ge=0, le=3)
    CAREER_PATH_TEMPERATURE: float = Field(default=0.2, ge=0, le=1)

    # --- RabbitMQ ---
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USERNAME: str = "admin"
    RABBITMQ_PASSWORD: str = "password123"

    @property
    def RABBITMQ_URL(self) -> str:
        return f"amqp://{self.RABBITMQ_USERNAME}:{self.RABBITMQ_PASSWORD}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/"

    CV_EXTRACT_QUEUE: str = "cv.extract.request"
    CV_RESULT_QUEUE: str = "cv.extract.response"
    APPLICATION_PROCESS_QUEUE: str = "ai.application.process.request"
    APPLICATION_EVENT_QUEUE: str = "ai.application.process.events"
    RABBITMQ_ENABLED: bool = False  # Disable by default for local dev

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # --- Backend API (for Knowledge Base & CompetencyLevel lookup) ---
    BACKEND_BASE_URL: str = "http://localhost:8080"
    KB_CACHE_TTL_SECONDS: int = 300  # 5 phút cache KB từ backend
    KB_WARMUP_TIMEOUT_SECONDS: float = Field(default=15.0, gt=0)

    # --- Checkpointer / State Persistence ---
    CHECKPOINTER_TYPE: str = "memory"  # "memory" or "postgres"
    DB_URL: str = "jdbc:postgresql://localhost:5432/tttn"
    DB_USERNAME: str = "postgres"
    DB_PASSWORD: str = "password123"

    @property
    def DATABASE_URL(self) -> str:
        url = self.DB_URL
        if url.startswith("jdbc:"):
            url = url[5:]
        if "://" in url:
            scheme, rest = url.split("://", 1)
            if self.DB_USERNAME and self.DB_PASSWORD and "@" not in rest:
                return f"{scheme}://{self.DB_USERNAME}:{self.DB_PASSWORD}@{rest}"
        return url

    # --- Observability / Tracing ---
    LANGSMITH_TRACING: bool = False
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "tttn-multi-agent-pipeline"
    LANGSMITH_ENDPOINT: str = ""
    LANGSMITH_WORKSPACE_ID: str = ""
    # Work around a Windows shutdown race in LangSmith's compressed trace writer.
    # Traces are still delivered, just without Zstandard compression.
    LANGSMITH_DISABLE_RUN_COMPRESSION: bool = True

    # Backward-compatible aliases for existing deployments. New configuration should use
    # LANGSMITH_* variables above.
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = ""
    ENABLE_METRICS_LOGGING: bool = True

    # --- OCR ---
    TESSERACT_LANG: str = "eng+vie"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def langsmith_tracing_enabled(self) -> bool:
        return self.LANGSMITH_TRACING or self.LANGCHAIN_TRACING_V2

    @property
    def langsmith_api_key(self) -> str:
        return self.LANGSMITH_API_KEY or self.LANGCHAIN_API_KEY

    @property
    def langsmith_project(self) -> str:
        return (
            self.LANGSMITH_PROJECT
            or self.LANGCHAIN_PROJECT
            or "tttn-multi-agent-pipeline"
        )


settings = Settings()


def configure_langsmith_environment() -> None:
    """Expose settings to LangGraph/LangSmith, which reads os.environ directly."""
    os.environ["LANGSMITH_TRACING"] = str(settings.langsmith_tracing_enabled).lower()
    os.environ["LANGSMITH_DISABLE_RUN_COMPRESSION"] = str(
        settings.LANGSMITH_DISABLE_RUN_COMPRESSION
    ).lower()
    if settings.langsmith_api_key:
        os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project
    if settings.LANGSMITH_ENDPOINT:
        os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
    if settings.LANGSMITH_WORKSPACE_ID:
        os.environ["LANGSMITH_WORKSPACE_ID"] = settings.LANGSMITH_WORKSPACE_ID


configure_langsmith_environment()
