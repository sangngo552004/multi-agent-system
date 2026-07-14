# CV Extraction Service - Kế hoạch Triển khai

Xây dựng Python FastAPI service trích xuất thông tin có cấu trúc từ CV (PDF/DOCX) sử dụng NER model `yashpwr/resume-ner-bert-v2`, tích hợp vào hệ thống multi-agent hiện có qua RabbitMQ.

## Phân tích Hiện trạng

| Component | Trạng thái |
|-----------|-----------|
| `ai-service/main.py` | Skeleton FastAPI, chỉ có endpoint `/` |
| `backend-core` | Spring Boot 4.1 với AMQP, PostgreSQL, Redis, JWT Auth |
| `docker-compose.yml` | PostgreSQL (pgvector), RabbitMQ, Redis |
| NER Model | `yashpwr/resume-ner-bert-v2` - BERT Token Classification, **max 512 tokens**, 12 entity labels |

### NER Model Labels (từ config.json)
| Label | Mapping sang Output |
|-------|-------------------|
| `Name` | `personal_info.name` |
| `Email Address` | `personal_info.email` |
| `Phone` | `personal_info.phone` |
| `Location` | `personal_info.location` |
| `Skills` | `skills[]` |
| `Companies worked at` | `experience[].company` |
| `Designation` | `experience[].title` |
| `Years of Experience` | `experience[].duration` |
| `College Name` | `education[].institution` |
| `Degree` | `education[].degree` |
| `Graduation Year` | `education[].year` |

> [!IMPORTANT]
> Model **không có** label cho certifications và description trong experience → cần bổ sung bằng regex/rule-based hoặc fallback LLM.

---

## User Review Required

> [!WARNING]
> **Thông tin nhạy cảm (Sensitive Data):** Yêu cầu của bạn có đề cập ảnh chân dung, ngày sinh, tình trạng hôn nhân, tôn giáo. Trong plan này, tôi sẽ **KHÔNG extract** các trường này. Nếu cần thêm, hãy cho biết.

> [!IMPORTANT]
> **LLM Fallback API:** Plan này chuẩn bị sẵn interface cho LLM fallback (Google Gemini vì project đã có `google-generativeai` trong requirements). Bạn cần cung cấp API key thực. Tôi sẽ thiết kế để có thể swap sang Claude/GPT dễ dàng qua config.

> [!IMPORTANT]
> **Tesseract OCR:** Cần cài đặt Tesseract trên máy host hoặc trong Docker image. Plan sẽ bao gồm Dockerfile với Tesseract pre-installed.

---

## Open Questions

> [!IMPORTANT]
> 1. **Budget LLM fallback:** Giới hạn chi phí cho LLM API là bao nhiêu/tháng? Hiện tôi sẽ set rate limit mặc định là 100 requests/ngày cho fallback.
> 2. **Ngưỡng confidence:** Tôi sẽ dùng **0.6** làm ngưỡng mặc định cho `low_confidence`. Bạn muốn thay đổi không?
> 3. **File size limit:** Tôi đặt mặc định **10MB**. OK?
> 4. **Giao tiếp với Java backend:** Hiện plan dùng **cả hai**: REST API (`POST /extract-cv`) cho xử lý đồng bộ/test + RabbitMQ consumer cho production async flow. Bạn muốn ưu tiên cách nào?

---

## Proposed Changes

### Component 1: Project Structure (ai-service)

Tái cấu trúc `ai-service/` từ single-file thành package có tổ chức:

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, routers, startup/shutdown
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic models (request/response)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_validator.py      # Validate file (MIME, size, pages, corrupt)
│   │   ├── text_extractor.py      # PDF/DOCX → raw text
│   │   ├── layout_classifier.py   # Phân loại 1-cột vs multi-column
│   │   ├── language_detector.py   # Detect ngôn ngữ (vi/en)
│   │   ├── ner_extractor.py       # NER pipeline + chunking + merge
│   │   ├── llm_fallback.py        # LLM API fallback (Gemini/GPT/Claude)
│   │   ├── output_normalizer.py   # Chuẩn hóa output JSON
│   │   └── cv_pipeline.py         # Orchestrator: điều phối toàn bộ pipeline
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── text_quality.py        # Kiểm tra chất lượng text (ký tự rác)
│   │   └── retry.py               # Retry logic with backoff
│   └── rabbitmq/
│       ├── __init__.py
│       └── consumer.py            # RabbitMQ consumer cho async processing
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Fixtures, test client, mock model
│   ├── test_file_validator.py
│   ├── test_text_extractor.py
│   ├── test_layout_classifier.py
│   ├── test_ner_extractor.py
│   ├── test_cv_pipeline.py
│   ├── test_api.py
│   └── fixtures/                  # Test CV files
│       └── README.md
├── Dockerfile
├── requirements.txt
├── pyproject.toml
├── .env.example
└── README.md
```

---

### Component 2: File Validation

#### [NEW] [file_validator.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/file_validator.py)

Xử lý validation đầu vào trước khi chạy pipeline:

- **Magic number check:** Dùng `python-magic` đọc bytes đầu file thay vì tin extension
  - PDF: `%PDF` (hex `25 50 44 46`)
  - DOCX: PK zip signature (hex `50 4B 03 04`)
- **Size limit:** Max 10MB (configurable)
- **Page count:** PDF max 10 pages, cảnh báo nếu > 3 pages
- **Corrupt detection:** Try-catch khi mở file, kiểm tra password-protected PDF
- **Empty file:** Check file size = 0 hoặc text extract = rỗng

Trả về `ValidationResult` với `is_valid`, `errors[]`, `warnings[]`, `file_info` (mime_type, page_count, file_size).

---

### Component 3: Text Extraction

#### [NEW] [text_extractor.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/text_extractor.py)

**PDF Pipeline:**
```
PDF file
  ├─ pdfplumber.extract_text() (text-based PDF)
  │   ├─ Text >= 50 chars/page → ✓ Dùng text này
  │   └─ Text < 50 chars/page → Nghi file scan
  │       └─ Fallback: pytesseract OCR (Tesseract)
  └─ Xử lý per-page: mỗi trang đánh giá riêng
```

**DOCX Pipeline:**
```
DOCX file
  ├─ python-docx: paragraphs + tables
  ├─ Xử lý text boxes (bổ sung parse XML body)
  └─ Merge text theo thứ tự logic
```

**Text Quality Check:**
- Tính tỷ lệ printable characters vs tổng characters
- Nếu < 70% printable → nghi font lỗi → `warning: garbled_text_detected`
- Log rõ: `extraction_method: "pdfplumber" | "ocr_tesseract" | "python_docx"`

---

### Component 4: Layout Classification

#### [NEW] [layout_classifier.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/layout_classifier.py)

Chỉ áp dụng cho PDF (DOCX đã có cấu trúc text rõ ràng):

- Dùng `pdfplumber` lấy `words` với x-coordinate (`x0`, `x1`)
- Tính phân bố x-coordinate: nếu text cluster ở 2+ vùng x khác nhau → multi-column
- **Thuật toán:**
  1. Lấy tất cả word bounding boxes
  2. K-means clustering (k=1,2,3) trên `x0` coordinate
  3. Nếu k=2 hoặc k=3 cho silhouette score > 0.5 → multi-column
  4. Confidence score = silhouette score
- Nếu confidence < 0.5 → mặc định `multi_column` (safe default)
- Output: `LayoutResult(layout_type="single_column"|"multi_column", confidence=0.xx)`

---

### Component 5: NER Extraction

#### [NEW] [ner_extractor.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/ner_extractor.py)

**Model loading:**
```python
from transformers import pipeline
ner_pipeline = pipeline(
    "ner",
    model="yashpwr/resume-ner-bert-v2",
    aggregation_strategy="simple"
)
```

**Chunking strategy (max 512 tokens):**
1. Tokenize toàn bộ text
2. Nếu <= 450 tokens → chạy thẳng (để buffer cho special tokens)
3. Nếu > 450 tokens → sliding window:
   - Window size = 450 tokens
   - Overlap = 50 tokens
   - Cắt tại ranh giới câu (regex `[.!?\n]`)
4. Merge entities từ các chunks:
   - Map character offset của chunk về vị trí gốc trong text
   - Xử lý overlap: nếu 2 entity cùng span → giữ entity có score cao hơn
   - Deduplicate entities trùng lặp (cùng text + cùng label)

**Confidence handling:**
- Mỗi entity có `score` từ model
- Score < 0.6 → gắn `low_confidence: true`
- Tất cả entities đều được giữ lại (không bỏ)

**Output:** List `NEREntity(text, label, score, start, end, low_confidence)`

---

### Component 6: Language Detection & Vietnamese Handling

#### [NEW] [language_detector.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/language_detector.py)

- Dùng `langdetect` (Google) để detect ngôn ngữ
- Chạy trên 500 ký tự đầu + 500 ký tự giữa + 500 ký tự cuối (tránh bias từ header)
- Hỗ trợ mixed language: nếu detect cả `vi` và `en` → `mixed`
- Output: `LanguageResult(primary="vi"|"en"|"unknown", is_mixed=bool, confidence=0.xx)`

**Trigger fallback cho tiếng Việt:**
- Nếu `primary == "vi"` VÀ NER thiếu >= 2 required fields (`name`, `email`) → fallback LLM

---

### Component 7: LLM Fallback

#### [NEW] [llm_fallback.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/llm_fallback.py)

**Điều kiện trigger (OR logic):**

| # | Điều kiện | Log reason |
|---|-----------|-----------|
| a | Text extract < 50 chars (cả sau OCR) | `text_too_short` |
| b | NER thiếu `name` VÀ `email` | `missing_required_fields` |
| c | Layout = multi_column VÀ NER missing >= 3 fields | `complex_layout_poor_ner` |
| d | Language = `vi` VÀ NER confidence trung bình < 0.5 | `vietnamese_low_confidence` |

**Implementation:**
- Dùng Google Gemini API (`google-generativeai`, đã có trong requirements)
- Structured prompt yêu cầu trả JSON theo schema chuẩn
- Timeout: 30s per request
- Retry: 2 lần với exponential backoff (1s, 3s)
- Rate limit: configurable, mặc định 100 requests/ngày
- Abstract class `LLMProvider` để dễ swap sang OpenAI/Anthropic

---

### Component 8: Output Normalizer

#### [NEW] [output_normalizer.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/output_normalizer.py)

**Mapping NER entities → structured output:**

```python
{
    "status": "success" | "partial" | "failed",
    "extraction_method": "ner_model" | "llm_fallback" | "rule_based",
    "language_detected": "vi" | "en" | "mixed" | "unknown",
    "layout_type": "single_column" | "multi_column",
    "personal_info": {
        "name": str | None,
        "email": str | None,   # Validate với regex
        "phone": str | None,   # Normalize format
        "location": str | None
    },
    "skills": [str],
    "experience": [{
        "title": str | None,      # Từ Designation
        "company": str | None,    # Từ Companies worked at
        "duration": str | None,   # Từ Years of Experience
        "description": str | None # Không có từ NER → None
    }],
    "education": [{
        "degree": str | None,
        "institution": str | None,
        "year": str | None
    }],
    "certifications": [],  # NER model không hỗ trợ → rỗng trừ khi LLM extract
    "confidence_scores": {
        "overall": float,
        "per_field": {}
    },
    "warnings": [],
    "processing_log": {
        "extraction_method": str,
        "ocr_used": bool,
        "fallback_reason": str | None,
        "processing_time_ms": int
    }
}
```

**Logic xác định status:**
- `success`: Có >= name + (email OR phone) + >= 1 skill
- `partial`: Thiếu 1 vài field nhưng có ít nhất name HOẶC email
- `failed`: Gần như rỗng, kèm warning `not_a_cv_document`

**Phát hiện "file không phải CV":**
- Nếu NER trả về < 3 entity types AND không có name/email → `warning: "document_may_not_be_a_cv"`

---

### Component 9: Pipeline Orchestrator

#### [NEW] [cv_pipeline.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/services/cv_pipeline.py)

Điều phối toàn bộ flow theo thứ tự:

```
1. Validate file
   ├─ Invalid → return error response
   └─ Valid ↓
2. Extract text
   ├─ Per-page text extraction
   ├─ Check text quality (garbled chars)
   └─ OCR fallback if needed
3. Classify layout (PDF only)
4. Detect language
5. NER extraction (with chunking)
6. Evaluate NER quality
   ├─ Good enough → normalize output
   └─ Trigger fallback? → LLM extraction
7. Normalize output
8. Return structured JSON
```

Mỗi step có try-catch riêng, nếu 1 step fail thì skip và ghi warning, không crash cả pipeline.

---

### Component 10: FastAPI API & RabbitMQ Consumer

#### [MODIFY] [main.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/main.py)

Refactor thành app package với:

**REST Endpoints:**
- `POST /extract-cv` — Upload file, xử lý đồng bộ, trả JSON
- `GET /health` — Health check (model loaded? service ready?)
- `GET /health/model` — Chi tiết model status

**Startup events:**
- Load NER model vào memory (1 lần duy nhất)
- Khởi tạo RabbitMQ consumer (background thread)

#### [NEW] [consumer.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/rabbitmq/consumer.py)

- Listen queue `cv.extract.request`
- Message format: `{"application_id": "uuid", "file_url": "...", "callback_queue": "cv.extract.response"}`
- Download file từ URL → chạy pipeline → publish result lên callback queue
- Ack/Nack pattern: Nack nếu processing fail → message quay lại queue

---

### Component 11: Configuration & Docker

#### [NEW] [config.py](file:///d:/1Study/TTTN/multi-agent-system/ai-service/app/config.py)

```python
class Settings(BaseSettings):
    # Model
    NER_MODEL_NAME: str = "yashpwr/resume-ner-bert-v2"
    CONFIDENCE_THRESHOLD: float = 0.6

    # File validation
    MAX_FILE_SIZE_MB: int = 10
    MAX_PAGE_COUNT: int = 10
    MIN_TEXT_LENGTH: int = 50

    # LLM Fallback
    GOOGLE_API_KEY: str = ""
    LLM_DAILY_RATE_LIMIT: int = 100
    LLM_TIMEOUT_SECONDS: int = 30

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:password123@localhost:5672/"
    CV_EXTRACT_QUEUE: str = "cv.extract.request"
    CV_RESULT_QUEUE: str = "cv.extract.response"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
```

#### [NEW] [Dockerfile](file:///d:/1Study/TTTN/multi-agent-system/ai-service/Dockerfile)

```dockerfile
FROM python:3.11-slim
# Install Tesseract OCR + Vietnamese language pack
RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-vie libmagic1
# Pre-download model at build time for faster startup
```

#### [MODIFY] [docker-compose.yml](file:///d:/1Study/TTTN/multi-agent-system/docker-compose.yml)

Thêm `ai-service` container với health check và dependency on RabbitMQ.

---

### Component 12: Dependencies

#### [MODIFY] [requirements.txt](file:///d:/1Study/TTTN/multi-agent-system/ai-service/requirements.txt)

Thêm dependencies mới:

| Package | Mục đích |
|---------|----------|
| `transformers` | Load NER model |
| `torch` | PyTorch backend cho transformers |
| `pdfplumber` | Extract text + layout từ PDF |
| `python-docx` | Extract text từ DOCX |
| `pytesseract` | OCR fallback |
| `Pillow` | Image processing cho OCR |
| `python-magic` | MIME type detection |
| `langdetect` | Language detection |
| `python-multipart` | FastAPI file upload |
| `pydantic-settings` | Configuration management |
| `scikit-learn` | K-means cho layout classification |
| `google-generativeai` | LLM fallback (đã có) |

---

### Component 13: Unit Tests

#### [NEW] Tests trong `ai-service/tests/`

| Test file | Coverage |
|-----------|----------|
| `test_file_validator.py` | File hợp lệ, file corrupt, file quá lớn, file rỗng, file password-protected, file sai MIME type |
| `test_text_extractor.py` | PDF text-based, PDF scan (mock OCR), DOCX standard, DOCX with text boxes, garbled text detection |
| `test_layout_classifier.py` | Single-column, multi-column, ambiguous layout |
| `test_ner_extractor.py` | Short text, long text chunking, overlapping entities, low confidence entities |
| `test_language_detector.py` | Tiếng Việt, tiếng Anh, mixed language |
| `test_cv_pipeline.py` | Happy path, fallback scenarios, timeout, non-CV document |
| `test_api.py` | REST endpoint, health check, concurrent uploads, large file rejection |

**Mock strategy:** Mock NER model trong tests để không cần download model thực (~500MB). Dùng fixture responses.

---

### Component 14: README

#### [NEW] [README.md](file:///d:/1Study/TTTN/multi-agent-system/ai-service/README.md)

Bao gồm:
- Giới hạn model (chỉ 12 entity labels, trained chủ yếu tiếng Anh, max 512 tokens)
- Ngưỡng confidence: 0.6
- Danh sách điều kiện trigger fallback LLM
- Chi phí ước tính: Gemini Flash ~$0.075/1M input tokens → ~100 CV/ngày ≈ $0.15/ngày
- Hướng dẫn chạy local và Docker

---

## Verification Plan

### Automated Tests
```bash
cd ai-service
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Manual Verification
1. Chạy service local → Upload các file CV test khác nhau qua `/extract-cv`
2. Test các edge case: file rỗng, file không phải CV, CV tiếng Việt, CV multi-column
3. Verify health check endpoint `/health`
4. Verify Docker build + container khởi động thành công
5. Test RabbitMQ consumer (publish message → verify response trên callback queue)

### Smoke Test Checklist
- [ ] Upload CV PDF tiếng Anh 1 cột → trả JSON đầy đủ
- [ ] Upload CV PDF tiếng Việt → trigger LLM fallback nếu NER kém
- [ ] Upload file .txt đổi extension thành .pdf → trả lỗi MIME type
- [ ] Upload file > 10MB → trả lỗi size
- [ ] Upload file Word có text box → extract được nội dung text box
- [ ] Health check trả `200 OK` khi model loaded
