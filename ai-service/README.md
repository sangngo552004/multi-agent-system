# AI Service - CV Extraction

Python FastAPI service for extracting structured information from CV/Resume files (PDF/DOCX) using NER model, with LLM fallback for Vietnamese CVs and complex layouts.

## Architecture

```
Next.js Frontend → Spring Boot Backend → RabbitMQ → AI Service (this)
                                                        ↓
                                              ┌─────────────────┐
                                              │  1. Validate     │
                                              │  2. Extract Text │
                                              │  3. Layout Class │
                                              │  4. Language Det │
                                              │  5. NER Extract  │
                                              │  6. LLM Fallback │
                                              │  7. Normalize    │
                                              └─────────────────┘
```

## Quick Start

### Local Development

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file
cp .env.example .env
# Edit .env with your API keys

# 4. Run the service
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
docker build -t tttn-ai-service .
docker run -p 8001:8000 tttn-ai-service
```

### With docker-compose (full stack)

```bash
docker-compose up -d
# AI service will be available at http://localhost:8001
```

## API Endpoints

### `POST /extract-cv`

Upload a CV file and get structured extraction results.

```bash
curl -X POST http://localhost:8000/extract-cv \
  -F "file=@resume.pdf"
```

**Response:**

```json
{
    "status": "success",
    "extraction_method": "ner_model",
    "language_detected": "en",
    "layout_type": "single_column",
    "personal_info": {
        "name": "John Doe",
        "email": "john@email.com",
        "phone": "+1 555-123-4567",
        "location": "San Francisco, CA"
    },
    "skills": ["Python", "Java", "Docker"],
    "experience": [
        {
            "title": "Software Engineer",
            "company": "Google",
            "duration": "2020 to 2024",
            "description": null
        }
    ],
    "education": [
        {
            "degree": "BS Computer Science",
            "institution": "MIT",
            "year": "2020"
        }
    ],
    "certifications": [],
    "confidence_scores": {
        "overall": 0.89,
        "per_field": {"name": 0.95, "email": 0.98}
    },
    "warnings": [],
    "processing_log": {
        "extraction_method": "ner_model",
        "ocr_used": false,
        "fallback_reason": null,
        "processing_time_ms": 1250
    }
}
```

### `GET /health`

Basic health check.

### `GET /health/model`

Detailed model and configuration status.

## NER Model

**Model:** [`yashpwr/resume-ner-bert-v2`](https://huggingface.co/yashpwr/resume-ner-bert-v2)

### Supported Entity Labels

| Label | Output Field |
|-------|-------------|
| Name | `personal_info.name` |
| Email Address | `personal_info.email` |
| Phone | `personal_info.phone` |
| Location | `personal_info.location` |
| Skills | `skills[]` |
| Companies worked at | `experience[].company` |
| Designation | `experience[].title` |
| Years of Experience | `experience[].duration` |
| College Name | `education[].institution` |
| Degree | `education[].degree` |
| Graduation Year | `education[].year` |

### Known Limitations

1. **Max 512 tokens** — Long CVs are processed with sliding window chunking
2. **English-focused** — Trained primarily on English resumes; Vietnamese CVs trigger LLM fallback
3. **No certifications** — Model doesn't have a certifications label
4. **No experience descriptions** — Only extracts job titles and companies
5. **Layout-dependent** — Multi-column/sidebar layouts may reduce accuracy

## Confidence Threshold

- **Default:** `0.6` (configurable via `CONFIDENCE_THRESHOLD` env var)
- Fields with confidence < threshold get `"low_confidence_on_{field}"` in warnings
- All entities are still included (never silently dropped)

## LLM Fallback

### Trigger Conditions

| Condition | Description |
|-----------|-------------|
| `text_too_short` | Extracted text < 50 characters (likely scanned/image CV) |
| `missing_required_fields` | NER returned no name AND no email |
| `complex_layout_poor_ner` | Multi-column layout + NER missing ≥ 3 fields |
| `vietnamese_low_confidence` | Vietnamese CV + average NER confidence < 0.5 |

### Cost Estimation (Gemini Flash)

- **Input:** ~$0.075 / 1M tokens
- **Average CV text:** ~1,500 tokens
- **100 fallback CVs/day ≈ $0.01/day ≈ $0.30/month**
- Rate limit: configurable via `LLM_DAILY_RATE_LIMIT` (default: 100/day)

## RabbitMQ Integration

### Request Queue: `cv.extract.request`

```json
{
    "application_id": "uuid-string",
    "file_url": "https://storage.example.com/cv.pdf",
    "callback_queue": "cv.extract.response"
}
```

### Response Queue: `cv.extract.response`

```json
{
    "application_id": "uuid-string",
    "result": { ... CVExtractionResponse ... },
    "error": null
}
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_file_validator.py -v
```

## Configuration

All settings configurable via environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `NER_MODEL_NAME` | `yashpwr/resume-ner-bert-v2` | HuggingFace model name |
| `CONFIDENCE_THRESHOLD` | `0.6` | Min confidence for entities |
| `MAX_FILE_SIZE_MB` | `10` | Max upload file size |
| `MAX_PAGE_COUNT` | `10` | Max PDF pages |
| `GOOGLE_API_KEY` | _(empty)_ | API key for Gemini LLM fallback |
| `LLM_DAILY_RATE_LIMIT` | `100` | Max LLM requests per day |
| `RABBITMQ_URL` | `amqp://...localhost:5672/` | RabbitMQ connection URL |
| `RABBITMQ_ENABLED` | `false` | Enable RabbitMQ consumer |
| `TESSERACT_LANG` | `eng+vie` | Tesseract OCR languages |
| `LOG_LEVEL` | `INFO` | Logging level |
