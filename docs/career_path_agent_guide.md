# Hướng dẫn Phát triển Career Path Agent (Dành cho Kỹ sư AI)

Tài liệu này hướng dẫn cách thức hoạt động và giao tiếp dữ liệu giữa hệ thống hiện tại (Đặc biệt là kết quả từ Matcher Agent) với **Career Path Agent** (Agent định hướng nghề nghiệp).

## 1. Vai trò của Career Path Agent
Trong khi Matcher Agent trả lời câu hỏi: *"Ứng viên này có phù hợp với vị trí A ở thời điểm hiện tại không?"*
Thì Career Path Agent trả lời câu hỏi: *"Ứng viên này đang ở đâu trên con đường sự nghiệp, và cần làm gì tiếp theo để đạt được vị trí B (Target Role) trong vòng X năm tới?"*

## 2. Đầu vào (Input) cho Career Path Agent
Career Path Agent không nên phải đọc lại CV từ đầu. Nó sẽ tận dụng dữ liệu đã được xử lý bởi hệ thống:

**A. Hồ sơ Năng lực Hiện tại (Candidate Competency Profile):**
Được trích xuất từ `CVExtractionResponse` và các `CompetencyEvidence` của Matcher Agent.
- Kỹ năng cứng đang có (Vd: Python, AWS).
- Cấp bậc hiện tại ước lượng (Vd: Junior).

**B. Vị trí Mục tiêu (Target Role Configuration):**
Một file `JobConfiguration` của vị trí mà ứng viên muốn hướng tới (Ví dụ: Ứng viên đang là Junior, Target Role là Senior Software Engineer).

## 3. Kiến trúc Đề xuất (Architecture)

### Bước 1: Gap Analysis (Phân tích Lỗ hổng)
Sử dụng Deterministic Code (không dùng LLM) để so sánh:
- Năng lực ứng viên ĐANG CÓ.
- Năng lực Target Role YÊU CẦU.
-> Output: `MissingCompetencies` (Các năng lực còn thiếu).

### Bước 2: LLM Career Mapping (Lập Kế hoạch với LLM)
Gửi `MissingCompetencies` vào LLM với Prompt là một **AI Career Coach**.
- LLM sẽ không làm toán, mà tập trung vào việc: Đưa ra lời khuyên thực tế (Actionable Advice).
- Ví dụ: Ứng viên thiếu năng lực "System Design", LLM sẽ khuyên: "Trong 6 tháng tới, hãy nhận các task liên quan đến thiết kế database, đọc sách 'Designing Data-Intensive Applications'".

## 4. Giao tiếp Dữ liệu (Schema Interface)

### Dữ liệu đầu vào (CareerPathRequest)
```json
{
  "candidate_id": "CAND_001",
  "current_cv_data": { ... }, // CVExtractionResponse
  "target_job_config": { ... }, // JobConfiguration của vị trí muốn hướng tới
  "timeframe_months": 24
}
```

### Dữ liệu đầu ra (CareerPathResponse)
```json
{
  "current_level": "JUNIOR",
  "target_level": "SENIOR",
  "gap_analysis": {
    "missing_hard_skills": ["System Design", "Kubernetes"],
    "missing_soft_skills": ["Leadership", "Stakeholder Management"],
    "experience_gap_years": 2
  },
  "action_plan": [
    {
      "phase": "Tháng 1-6",
      "focus_area": "Củng cố kiến thức System Design",
      "recommended_actions": [
        "Đọc sách Designing Data-Intensive Applications",
        "Xin tham gia vào các buổi họp thiết kế hệ thống của team"
      ]
    },
    {
      "phase": "Tháng 6-12",
      "focus_area": "Làm quen với CI/CD và Kubernetes",
      "recommended_actions": [ ... ]
    }
  ],
  "estimated_readiness_score": 45.0 // % Sẵn sàng hiện tại so với Target Role
}
```

## 5. Lưu ý cho Kỹ sư Phát triển (Dev Notes)
- Tránh bắt LLM tự bịa ra Target Role. Target Role phải được lấy từ thư viện `JobConfiguration` của hệ thống (chính là cơ sở dữ liệu của công ty) để đảm bảo lộ trình thăng tiến sát với thực tế doanh nghiệp.
- Tập trung vào việc Tuning LLM Prompt để lời khuyên mang tính "Thực chiến" (Actionable) thay vì các lời khuyên sáo rỗng (như "Bạn nên học nhiều hơn").
