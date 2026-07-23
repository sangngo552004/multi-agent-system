"""Application configuration using pydantic-settings."""

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
    RABBITMQ_URL: str = "amqp://admin:password123@localhost:5672/"
    CV_EXTRACT_QUEUE: str = "cv.extract.request"
    CV_RESULT_QUEUE: str = "cv.extract.response"
    RABBITMQ_ENABLED: bool = False  # Disable by default for local dev

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # --- Backend API (for Knowledge Base & CompetencyLevel lookup) ---
    BACKEND_BASE_URL: str = "http://localhost:8080"
    KB_CACHE_TTL_SECONDS: int = 300  # 5 phút cache KB từ backend

    # --- Checkpointer / State Persistence ---
    CHECKPOINTER_TYPE: str = "memory"  # "memory" or "postgres"
    DATABASE_URL: str = "postgresql://postgres:password123@localhost:5432/tttn"

    # --- Observability / Tracing ---
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "tttn-multi-agent-pipeline"
    ENABLE_METRICS_LOGGING: bool = True

    # --- OCR ---
    TESSERACT_LANG: str = "eng+vie"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
