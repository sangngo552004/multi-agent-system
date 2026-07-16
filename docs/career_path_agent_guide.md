# Hướng dẫn Phát triển Career Path Agent (Dành cho Kỹ sư AI)

Tài liệu này hướng dẫn cách thức hoạt động và giao tiếp dữ liệu giữa hệ thống hiện tại (đặc biệt là kết quả từ Matcher Agent) với **Career Path Agent** (Agent định hướng nghề nghiệp).

> **Trạng thái:** Đây là tài liệu interface contract — Matcher Agent đã implement xong phần
> backend, đồng đội có thể bắt đầu build Career Path Agent song song mà không cần chờ Matcher hoàn chỉnh.

---

## 1. Vai trò của Career Path Agent

Trong khi Matcher Agent trả lời câu hỏi:
> *"Ứng viên này có phù hợp với vị trí A ở thời điểm hiện tại không?"*

Thì Career Path Agent trả lời câu hỏi:
> *"Ứng viên này đang ở đâu trên con đường sự nghiệp, và cần làm gì tiếp theo để đạt được vị trí B (Target Role) trong vòng X năm tới?"*

---

## 2. Đầu vào (Input) cho Career Path Agent

Career Path Agent **không cần đọc lại CV từ đầu**. Nó tận dụng dữ liệu đã được xử lý bởi hệ thống:

### A. Hồ sơ Năng lực Hiện tại (Candidate Competency Profile)

Được trích xuất từ `CVExtractionResponse` và `evidence_matrix` của Matcher Agent.

```python
# Schema: app.core.schemas.CVExtractionResponse
{
  "personal_info": { "name": "...", "email": "...", "location": "..." },
  "skills": ["Python", "Docker", ...],          # danh sách kỹ năng thô
  "experience": [
    { "title": "...", "company": "...", "duration": "...", "description": "..." }
  ],
  "education": [
    { "degree": "...", "institution": "...", "year": "..." }
  ],
  "certifications": [...]
}
```

Ngoài ra, nếu ứng viên **đã được Matcher chấm điểm**, có thể đọc thêm `scoring_breakdown`
từ `Application` entity (lấy qua backend API) để biết **từng competency ứng viên đang đạt ở mức nào**:

```python
# Application.scoring_breakdown (JSONB) — đọc từ GET /api/applications/{id}
{
  "competency_scores": [
    {
      "competency_id": "uuid",
      "competency_name": "System Design",
      "category": "HARD_SKILL",
      "weight": 0.3,
      "earned_weight": 0.09,   # weight * multiplier → cho biết đang đạt bao nhiêu %
      "multiplier": 0.3,        # 1.0=HIGH, 0.8=meets+MEDIUM, 0.3=fails+MEDIUM, 0.0=LOW
      "meets_requirement": false,
      "confidence": "MEDIUM",
      "is_mandatory": true
    },
    ...
  ],
  "rules_triggered": [...]
}
```

### B. Vị trí Mục tiêu (Target Role Configuration)

Một `JobConfiguration` của vị trí ứng viên muốn hướng tới.

> **Quan trọng:** Bắt buộc lấy `JobConfiguration` từ DB của hệ thống (không được để LLM tự bịa)
> để lộ trình sát thực tế doanh nghiệp.

```python
# Schema: app.core.schemas.JobConfiguration
{
  "job_id": "uuid",
  "job_family": "ENGINEERING",
  "career_level": "SENIOR",
  "required_competencies": [
    {
      "competency_id": "uuid",
      "name": "System Design",
      "category": "HARD_SKILL",
      "weight": 0.3,
      "required_level": 4,      # Bậc yêu cầu: 1 (Cơ bản) → 5 (Chuyên gia)
      "is_mandatory": true
    },
    ...
  ]
}
```

#### Tra cứu ngữ nghĩa required_level (QUAN TRỌNG)

`required_level` là số nguyên 1–5, **cần tra cứu label + description** qua API để Gap Analysis
có ý nghĩa thực tế thay vì chỉ so sánh số:

```
GET /api/competencies/{competency_id}/levels/{level}

→ Response:
{
  "level": 4,
  "label": "Nâng cao",
  "description": "Thiết kế microservices, xử lý concurrency, tối ưu performance."
}
```

Dùng `description` này trong LLM prompt để LLM tư vấn đúng kỳ vọng của cấp bậc đó.

---

## 3. Kiến trúc Đề xuất (Architecture)

```
Input: CVExtractionResponse + scoring_breakdown (optional) + Target JobConfiguration
        │
        ▼
[Bước 1] Gap Analysis — Deterministic Code (không LLM)
        │  So sánh năng lực hiện tại vs Target Role
        │  → Output: MissingCompetencies (có level context)
        │
        ▼
[Bước 2] LLM Career Mapping — Gemini (AI Career Coach persona)
        │  Nhận MissingCompetencies + level descriptions + timeframe
        │  → KHÔNG làm toán, chỉ đưa Actionable Advice
        │
        ▼
Output: CareerPathResponse (action plan phân theo phase)
```

### Bước 1: Gap Analysis (Deterministic)

So sánh:
- Năng lực ứng viên **ĐANG CÓ** (từ `skills`, `experience`, và `competency_scores.multiplier`).
- Năng lực Target Role **YÊU CẦU** (từ `required_competencies` kèm `required_level`).

Output `MissingCompetency` nên bao gồm cả thông tin level để LLM tư vấn chính xác:

```python
{
  "competency_id": "uuid",
  "name": "System Design",
  "category": "HARD_SKILL",
  "estimated_current_level": 2,      # ước lượng từ evidence/multiplier
  "required_level": 4,
  "level_gap": 2,
  "required_level_description": "Nâng cao: Thiết kế microservices, xử lý concurrency...",
  "is_mandatory": true
}
```

### Bước 2: LLM Career Mapping

LLM đóng vai **AI Career Coach** — nhận `MissingCompetencies` và đưa lời khuyên thực chiến:

```
Ứng viên thiếu "System Design" (cần level 4: "Thiết kế microservices, xử lý concurrency").
→ LLM tư vấn: "Trong 6 tháng tới, hãy nhận các task thiết kế database schema,
   đọc 'Designing Data-Intensive Applications', tham gia họp architecture của team."
```

---

## 4. Schema Interface

### Request (CareerPathRequest)

```json
{
  "candidate_id": "uuid",
  "current_cv_data": { },
  "scoring_breakdown": { },
  "target_job_config": { },
  "timeframe_months": 24
}
```

| Field | Bắt buộc | Nguồn |
|---|---|---|
| `candidate_id` | ✅ | Frontend |
| `current_cv_data` | ✅ | `CVExtractionResponse` từ CV Extractor Agent |
| `scoring_breakdown` | ⬜ optional | `Application.scoring_breakdown` (nếu đã được Matcher chấm) |
| `target_job_config` | ✅ | `JobConfiguration` từ DB |
| `timeframe_months` | ✅ | Do ứng viên chọn (vd: 12, 24, 36) |

### Response (CareerPathResponse)

```json
{
  "current_level": "JUNIOR",
  "target_level": "SENIOR",

  "gap_analysis": {
    "missing_competencies": [
      {
        "name": "System Design",
        "category": "HARD_SKILL",
        "estimated_current_level": 2,
        "required_level": 4,
        "level_gap": 2,
        "required_level_description": "Thiết kế microservices, xử lý concurrency...",
        "is_mandatory": true,
        "priority": "HIGH"
      }
    ],
    "total_gap_score": 55.0
  },

  "action_plan": [
    {
      "phase": "Tháng 1-6",
      "focus_competency": "System Design",
      "focus_area": "Củng cố kiến thức thiết kế hệ thống",
      "recommended_actions": [
        "Đọc sách 'Designing Data-Intensive Applications'",
        "Xin tham gia các buổi họp thiết kế của team",
        "Nhận task thiết kế database schema cho feature nhỏ"
      ]
    },
    {
      "phase": "Tháng 6-12",
      "focus_competency": "Kubernetes",
      "focus_area": "Làm quen CI/CD và container orchestration",
      "recommended_actions": ["..."]
    }
  ],

  "estimated_readiness_score": 45.0
}
```

---

## 5. Lưu ý cho Kỹ sư Phát triển (Dev Notes)

1. **Không để LLM tự bịa Target Role.** Target Role phải lấy từ `JobConfiguration` trong DB
   để lộ trình thăng tiến sát thực tế của doanh nghiệp.

2. **Tra cứu `CompetencyLevel` trước khi gọi LLM.** Gọi
   `GET /api/competencies/{id}/levels/{level}` để lấy `label` + `description`, nhúng vào prompt.
   LLM sẽ tư vấn đúng kỳ vọng thực tế thay vì đoán mò level nghĩa là gì.

3. **Ưu tiên Actionable Advice.** Tune LLM Prompt để lời khuyên cụ thể, thực chiến
   ("Nhận task X trong sprint tới") thay vì sáo rỗng ("Bạn nên học nhiều hơn").

4. **`scoring_breakdown` là optional enrichment.** Nếu ứng viên đã được Matcher chấm,
   dùng `competency_scores[*].multiplier` để ước lượng `estimated_current_level` chính xác hơn.
   Nếu không có → dùng `CVExtractionResponse.skills` như trước.

5. **`CareerPathRequest.timeframe_months` ảnh hưởng độ dài action plan.**
   24 tháng → 4 phase (mỗi 6 tháng). 12 tháng → 2 phase. Hardcode logic này hoặc để LLM tự phân.
