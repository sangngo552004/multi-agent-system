# Kế hoạch coding Career Path Agent

> Trạng thái: kế hoạch triển khai, chưa thực hiện code  
> Phạm vi chính: `ai-service/app/agents/career_path_agent/`  
> Cơ sở: code tại commit `8e9f89c` và [career_path_agent_plan.md](./career_path_agent_plan.md)  
> Ngày lập: 2026-07-17

## 1. Mục tiêu của kế hoạch

Triển khai Career Path Agent theo đúng kiến trúc đã phân tích:

```text
input gate
  → deterministic gap analysis
  → deterministic prioritization
  → deterministic roadmap skeleton
  → optional LLM enrichment
  → deterministic validation
  → internal output + allowlisted candidate view
```

Agent chỉ tạo roadmap cho một quyết định reject cuối cùng, có reason phù hợp và dữ liệu upstream đủ chất lượng. Agent không quyết định tuyển dụng, không tự truy cập DB, không tự gửi email và không dùng LLM làm nơi chứa toàn bộ business rule.

Kết quả coding phải đạt bốn thuộc tính:

- Có contract Pydantic rõ ràng và version được.
- Phần nghiệp vụ quan trọng chạy deterministic và unit-test được.
- LLM có thể lỗi hoặc bị tắt mà service vẫn fail closed, không phát roadmap suy đoán.
- Có thể tích hợp dần với graph/backend mà không nối nhầm vào nhánh score thấp hiện tại.

## 2. Các quyết định triển khai đã chốt

### 2.1. Bám structure hiện có

Theo structure của Extractor và Matcher:

- `agent.py` là façade điều phối và export singleton.
- Schema request/response tiếp tục đặt trong `app/core/schemas.py` để nhất quán với code hiện tại.
- Logic deterministic được tách thành module nhỏ tương tự `scoring_engine.py`, `vector_matcher.py`, `kb_loader.py`.
- Config tiếp tục dùng `app/core/config.py` và `.env.example`.
- REST endpoint tạm đặt trong `app/main.py`, giống `/extract-cv` và `/process-application`.
- Test đặt trong `ai-service/tests/`, dùng `pytest`, `unittest.mock` và fixture như test hiện tại.
- Không thêm `__init__.py` vào thư mục agent nếu import không yêu cầu, vì hai agent hiện có cũng đang dùng namespace package theo cách này.

### 2.2. Không thêm production dependency trong MVP

MVP dùng các thư viện đã có:

- Pydantic cho contract và validation.
- `google-generativeai` cho structured generation.
- `asyncio` cho timeout và chuyển blocking call khỏi event loop.
- LangGraph cho integration sau decision gate.
- `pytest`/`pytest-asyncio`/`pytest-cov` cho test.

`requirements.txt` không cần thay đổi trong PR đầu. LangSmith/Ragas chỉ là bước evaluation tùy chọn sau này, không đưa vào runtime của Career Path Agent.

### 2.3. Không nối vào `check_score()` hiện tại

Không thay placeholder bằng cách gọi Career Path Agent trực tiếp từ nhánh:

```python
overall_score < 50 → career_path
```

Lý do: score thấp chưa phải decision cuối cùng. Integration chỉ được bật khi state có `DecisionSnapshot` với `outcome=REJECTED`, `is_final=true` và reason code áp dụng được.

### 2.4. Backend là source of truth

Career Path Agent nhận immutable snapshot qua request. Nó không gọi repository/DB để:

- Tự lấy application.
- Tự lấy quyết định HR.
- Tự đổi application status.
- Tự persist roadmap.
- Tự gửi email.

Backend/orchestrator chịu trách nhiệm tập hợp và persist. Việc này giúp agent là một hàm gần-pure, dễ replay và eval.

### 2.5. LLM chỉ sinh draft trong giới hạn

LLM không được sinh hoặc thay đổi:

- Decision và reason code.
- Job/competency ID, target level, weight, mandatory flag.
- Gap assessment, priority và action mode.
- Resource ID ngoài catalog.
- Provenance, status và review flag.

LLM chỉ được đề xuất cách diễn đạt, activity, deliverable và assessment theo `CareerPathDraft` schema. Code merge draft vào skeleton, rồi validate lại.

## 3. Phạm vi coding

### 3.1. Trong phạm vi

- Request/output schemas và enums cho Career Path.
- Applicability/input quality gate.
- Gap ledger từ `CVExtractionResponse`, `MatchingOutput` và `JobConfiguration`.
- Priority/action mode deterministic.
- Roadmap skeleton và approved resource lookup.
- Structured LLM generation với timeout/retry.
- Output validator và candidate renderer.
- Standalone REST endpoint.
- Career path node và decision-based routing sau khi standalone flow ổn định.
- Unit, contract, API, security và integration tests.
- Seed evaluation fixtures và cách chạy eval offline.

### 3.2. Ngoài phạm vi của module này

- Backend application/job CRUD.
- Database migrations để lưu roadmap/decision/resource catalog.
- Email sender/template.
- UI HR/candidate.
- Quyết định auto-reject policy.
- Việc tạo đầy đủ competency/level/resource data cho mọi job.
- Thay đổi Extractor/Matcher ngoài các contract tối thiểu cần truyền dữ liệu.

Các hạng mục ngoài phạm vi là dependency integration, không được âm thầm giả lập trong agent.

## 4. File structure mục tiêu

```text
ai-service/
├── app/
│   ├── agents/
│   │   ├── career_path_agent/
│   │   │   ├── agent.py
│   │   │   ├── snapshot_adapter.py
│   │   │   ├── gap_analyzer.py
│   │   │   ├── prioritization_engine.py
│   │   │   ├── roadmap_builder.py
│   │   │   ├── resource_catalog.py
│   │   │   ├── roadmap_validator.py
│   │   │   └── renderer.py
│   │   └── orchestrator.py
│   ├── core/
│   │   ├── schemas.py
│   │   └── config.py
│   └── main.py
├── tests/
│   ├── conftest.py
│   ├── test_career_path_snapshot_adapter.py
│   ├── test_career_path_gap_analyzer.py
│   ├── test_career_path_prioritization.py
│   ├── test_career_path_validator.py
│   ├── test_career_path_agent.py
│   ├── test_career_path_api.py
│   ├── test_career_path_orchestrator.py
│   └── fixtures/
│       └── career_path_cases.json
└── evals/
    └── career_path/
        ├── README.md
        ├── seed_cases.jsonl
        └── run_eval.py
```

Không bắt buộc tạo toàn bộ file trong một PR. Thứ tự triển khai ở phần 14 nhằm giữ mỗi PR nhỏ và kiểm chứng được.

## 5. Thiết kế schema trong `app/core/schemas.py`

### 5.1. Enum cần thêm

| Enum | Giá trị dự kiến | Mục đích |
|---|---|---|
| `CareerPathStatus` | `GENERATED`, `NOT_APPLICABLE`, `INSUFFICIENT_INPUT`, `NEEDS_HUMAN_REVIEW`, `FAILED` | Tránh status string tự do |
| `DeliveryStatus` | `BLOCKED`, `REVIEW_REQUIRED`, `ELIGIBLE` | Tách việc có draft khỏi quyền gửi ra ngoài |
| `DecisionOutcome` | `ACCEPTED`, `REJECTED`, `PENDING_REVIEW` | Decision gate |
| `DecisionSource` | `HR`, `AUTO_POLICY` | Audit nguồn quyết định |
| `GapAssessment` | `MET`, `PARTIAL`, `NOT_EVIDENCED`, `UNKNOWN` | Không đồng nhất absence với lack |
| `GapPriority` | `P0`, `P1`, `P2` | Priority deterministic |
| `GapActionMode` | `LEARN`, `PRACTICE`, `ASSESS_FIRST`, `BUILD_EVIDENCE` | Phân biệt học mới và chứng minh năng lực |
| `DataQualityGrade` | `SUFFICIENT`, `LIMITED`, `INSUFFICIENT` | Quality gate và review |

Reason code chưa tạo enum cứng trong PR đầu vì taxonomy thuộc HR/Product và chưa được chốt. Dùng `list[str]` có validator không rỗng, rồi kiểm tra bằng `PlanningPolicy.applicable_reason_codes`. Sau khi taxonomy ổn định mới nâng thành enum.

### 5.2. Input models

#### `DecisionSnapshot`

- `decision_id: str`
- `outcome: DecisionOutcome`
- `is_final: bool`
- `source: DecisionSource`
- `reason_codes: list[str]`
- `related_competency_ids: list[str]`
- `approved_rationale: Optional[str]`
- `policy_version: str`
- `decided_at: datetime`

`related_competency_ids` là liên kết có cấu trúc giữa decision và target competency. Validator phải bảo đảm ID thuộc job snapshot. `approved_rationale` là nội bộ và không được chuyển thẳng vào candidate view.

#### `CandidateConstraints`

- `hours_per_week: Optional[int]`
- `max_duration_weeks: Optional[int]`
- `preferred_language: str` (`vi`/`en` trong MVP)
- `budget_level: Optional[str]`
- `preferred_formats: list[str]`

Các range được validate. Không nhận free-form PII trong model này.

#### `PlanningPolicy`

- `policy_version: str`
- `applicable_reason_codes: list[str]`
- `default_hours_per_week: int`
- `default_duration_weeks: int`
- `max_duration_weeks: int`
- `max_phases: int`
- `core_gap_count: int`
- `allow_candidate_auto_delivery: bool`
- `resource_max_age_days: int`

Các default nghiệp vụ phải nằm trong request snapshot/policy có version, không giấu trong prompt. Giá trị thật cần HR/SME xác nhận trước production; test dùng fixture policy rõ ràng.

#### `ApprovedLearningResource`

- `resource_id`, `title`, `provider`.
- `competency_ids`, supported levels.
- `language`, `format`, `cost_level`, `estimated_hours`.
- `url`, `last_verified_at`, `catalog_version`.

Agent chỉ được tham chiếu resource ID có trong request. Không gọi live URL và không cho LLM tự tạo resource.

#### `CareerPathCandidateSnapshot`

Snapshot tối thiểu được adapter tạo từ `CVExtractionResponse`:

- Extraction status, language, skills.
- Experience, education, certifications.
- Per-field confidence, warnings và extractor version nếu có.

Không chứa `personal_info`. Career Path planner không cần name, email, phone hoặc location để xây gap/roadmap. Backend có thể dùng name ở lớp email template sau khi plan đã được duyệt.

#### `CareerPathMatchingSnapshot`

Snapshot tối thiểu được adapter tạo từ `MatchingOutput`:

- Matcher status dùng cho upstream quality gate; decision snapshot là nguồn duy nhất cho reject reason.
- `evidence_matrix`, `matched_criteria`, `missing_criteria`.
- Matcher/model version nếu upstream cung cấp.

Không chứa `hr_recommendation`, potential flags, overall/sub-scores hoặc triggered pedigree rules vì các trường này không cần để lập roadmap và có nguy cơ bị lộ ra candidate content.

#### `CareerPathCompetencyTarget` và `CareerPathJobSnapshot`

`JobConfiguration` hiện chỉ mang `required_level` dạng số; matcher tra level description lúc build prompt nhưng không lưu lại vào object. Career Path cần snapshot được enrich và freeze:

`CareerPathCompetencyTarget` gồm competency ID/name/category, weight, required level, `required_level_description`, mandatory flag và data version.

`CareerPathJobSnapshot` gồm job ID, family, career level, optional title, danh sách target competencies và job snapshot version. Nó không chứa institutional/pedigree rules vì roadmap không dùng các bonus rule này.

Snapshot adapter tạo object này từ `JobConfiguration` và mapping level descriptions. Trong compatibility path, orchestrator có thể tái sử dụng `kb_loader.get_competency_level_description()` trước khi gọi agent; giá trị đã tra phải được freeze trong request. Nếu description của critical competency không có, input bị đánh `INSUFFICIENT` hoặc bắt buộc review, không để LLM tự diễn giải level number.

#### `CareerPathRequest`

- `schema_version`, `request_id`, `application_id`, `idempotency_key`.
- `decision: DecisionSnapshot`.
- `candidate_snapshot: CareerPathCandidateSnapshot`.
- `matching_snapshot: CareerPathMatchingSnapshot`.
- `job_snapshot: CareerPathJobSnapshot`.
- `candidate_constraints: CandidateConstraints`.
- `planning_policy: PlanningPolicy`.
- `approved_resources: list[ApprovedLearningResource]`.
- Upstream version metadata nếu backend có thể cung cấp.

Không đưa `hr_preferences`, `personal_info`, HR recommendation hoặc score vào Career Path request. Adapter là trust boundary bắt buộc, không chỉ trông chờ prompt builder nhớ loại field.

### 5.3. Internal processing models

#### `EvidenceReference`

- `source`: `MATCHER_EVIDENCE`, `VECTOR_MATCH`, `CV_FIELD`, `SCORING_BREAKDOWN`.
- `path`: đường dẫn logic như `evidence_matrix.<competency_id>`.
- `summary`.
- `confidence`.

Trong MVP, reference là logical path vì Extractor chưa có raw span. Không ghi là raw quote nếu upstream không cung cấp span.

#### `CompetencyGap`

- `gap_id`, competency identity/category.
- `required_level`, `required_level_description`.
- `current_assessment`, `observed_level: Optional[int]`.
- `priority`, `action_mode`.
- `is_mandatory`, `weight`.
- `reason_codes`, `evidence_refs`.
- `rationale`, `requires_human_review`.

`observed_level` để `None` khi upstream không xác định được; tuyệt đối không lấy `required_level - 1` làm current level giả định.

#### Roadmap models

- `RoadmapActivity`.
- `RoadmapDeliverable`.
- `RoadmapAssessment` với method và acceptance criteria.
- `RoadmapPhase` với duration, addressed gap IDs, prerequisites, activity, deliverable, assessment và resource IDs.
- `CareerPathDraft`: schema duy nhất LLM được sinh.

`CareerPathDraft` không chứa decision, score, full gap object, status hoặc provenance.

### 5.4. Output models

#### `CareerPathDiagnostics`

- Data quality grade và limitations.
- Validator errors/warnings.
- LLM used/fallback reason.
- `requires_human_review`.
- Processing time.

#### `CareerPathProvenance`

- Schema/agent/prompt/model version.
- Job/policy/resource catalog version.
- Extractor/matcher version nếu có.

#### `CandidateCareerPathView`

Chỉ gồm:

- Target role summary.
- Demonstrated strengths có evidence.
- Priority growth areas diễn đạt an toàn.
- Phases/checkpoints/resources đã allowlist.
- Limitation/disclaimer được duyệt.

Không gồm score, `scoring_breakdown`, `hr_recommendation`, hidden preferences, pedigree, internal reason rationale hoặc diagnostics.

#### `CareerPathOutput`

- Request/application/decision references.
- `status`.
- `delivery_status`.
- Target job snapshot.
- Data quality.
- Full gap ledger.
- Internal roadmap phases.
- `candidate_view: Optional[CandidateCareerPathView]`.
- Diagnostics và provenance.

`candidate_view` chỉ được tạo sau khi structural/safety validation pass. Khi policy yêu cầu HR duyệt, output có thể chứa candidate draft để reviewer xem chính xác wording, nhưng `delivery_status=REVIEW_REQUIRED`. Backend chỉ được gửi khi `delivery_status=ELIGIBLE`; `status` hoặc sự tồn tại của candidate view không đủ để cấp quyền gửi.

## 6. Trách nhiệm từng module

### 6.1. `snapshot_adapter.py`

Tạo trust boundary giữa output upstream và Career Path request:

- `build_candidate_snapshot(cv_data: CVExtractionResponse)`.
- `build_matching_snapshot(match_result: MatchingOutput)`.
- `build_job_snapshot(job_configuration: JobConfiguration, level_descriptions: dict)`.
- Chỉ copy các field allowlist nêu ở phần schema.
- Loại `personal_info`, matcher rejection text, aggregate/competency scores, `scoring_breakdown`, `hr_recommendation`, potential flags và triggered pedigree rules.
- Chuẩn hóa version metadata và logical evidence paths.
- Loại institutional rules khỏi job snapshot và yêu cầu semantic description cho critical target levels.
- Không sửa object upstream.

Adapter được dùng bởi orchestrator/backend integration. Standalone endpoint nhận snapshot đã tối giản; nếu cần endpoint compatibility nhận raw upstream object thì phải đặt ở route nội bộ khác và gọi adapter trước khi vào agent.

### 6.2. `gap_analyzer.py`

Export một class/singleton tương tự scoring engine:

- `CareerGapAnalyzer.analyze(request) -> GapAnalysisResult`.
- Join theo `competency_id`, không join theo text trừ fallback có cờ review.
- Dùng `evidence_matrix` làm nguồn chính.
- Dùng `matched_criteria`/`missing_criteria` để bổ sung hard-skill evidence khi matrix thiếu.
- Dùng job snapshot làm danh sách competency đầy đủ; không phụ thuộc `scoring_breakdown`, vì breakdown có thể thiếu khi early knockout và chứa điểm nội bộ không cần cho roadmap.
- Loại `PEDIGREE` khỏi learning gaps.
- Giữ competency `MET` để renderer có thể nêu strength; chỉ `PARTIAL`, `NOT_EVIDENCED`, `UNKNOWN` đi vào roadmap.

Quy tắc assessment ban đầu:

| Tình huống | Assessment | Ghi chú |
|---|---|---|
| Evidence `meets_requirement=true` | `MET` | Không tự suy ra observed level nếu upstream không có |
| Evidence `false`, confidence `MEDIUM`, có evidence một phần | `PARTIAL` | Tạo practice/build evidence |
| Evidence `false`, confidence `LOW`, nội dung là không có thông tin | `NOT_EVIDENCED` | Dùng ngôn ngữ “CV chưa thể hiện” |
| Không có evidence hoặc nguồn mâu thuẫn | `UNKNOWN` | `ASSESS_FIRST`, review nếu critical |
| Matcher/vector báo skill missing nhưng không có matrix | `NOT_EVIDENCED` với source vector | Bắt buộc review cho auto-delivery |

Không parse câu tiếng Việt `rejection_reason` bằng regex để quyết định competency nếu đã có ID/reason code. Text parsing chỉ dùng làm warning trong legacy fallback.

### 6.3. `prioritization_engine.py`

Export:

- `CareerPathPrioritizationEngine.prioritize(gaps, request) -> list[CompetencyGap]`.

Quy tắc không dùng LLM:

- `P0`: mandatory và chưa `MET`.
- `P1`: competency gắn trực tiếp với reason code hoặc matcher đánh `criticality=HIGH`; nếu reason không ánh xạ đến competency ID, promote tối đa `core_gap_count` gap có weight cao nhất theo policy.
- `P2`: các gap có thể phát triển còn lại, sắp theo weight giảm dần rồi competency ID để ổn định.
- `UNKNOWN`/confidence thấp giữ priority theo business impact nhưng action mode là `ASSESS_FIRST`.
- Experience gap không được chuyển thành lời hứa rút ngắn số năm; action mode là `BUILD_EVIDENCE`/`PRACTICE` và gắn review khi target level cao.
- Soft skill thiếu evidence mặc định `ASSESS_FIRST`, không kết luận thiếu năng lực từ keyword.

Không tạo một priority score nhiều hệ số trong PR đầu. Tier rule dễ giải thích và test hơn. Chỉ thêm công thức có version sau khi có dữ liệu calibration.

### 6.4. `resource_catalog.py`

Không phải HTTP client. Module chỉ:

- Index resource theo ID và competency.
- Lọc theo language, level, format, budget và `last_verified_at`.
- Trả candidate resources cho roadmap builder.
- Validate mọi resource ID trong LLM draft thuộc allowlist.

Nếu không có resource phù hợp, roadmap vẫn có activity/deliverable/assessment nhưng không nêu link. Thêm warning `approved_resource_not_available`, không bịa resource.

### 6.5. `roadmap_builder.py`

Trách nhiệm deterministic:

- Resolve hours/week và duration từ candidate constraints + planning policy.
- Tạo skeleton phases theo priority/dependency.
- Bảo đảm mọi `P0/P1` gap được gán vào phase.
- Tạo assessment-first phase cho uncertainty critical.
- Giới hạn số phase và tổng duration.
- Tạo sanitized prompt payload không có PII, score hoặc internal rationale.
- Merge `CareerPathDraft` vào protected skeleton; model không được thay IDs/priority.
- Tạo deterministic fallback draft nội bộ khi LLM không available.

Fallback không được tạo candidate view tự động. Output là `NEEDS_HUMAN_REVIEW` với skeleton để HR/SME chỉnh.

### 6.6. `roadmap_validator.py`

Validator trả structured result, không chỉ boolean:

- `is_valid`.
- `errors: list[str]`.
- `warnings: list[str]`.
- Metric tạm thời: critical gap coverage, assessment completeness, resource validity.

Hard checks:

1. Tất cả `P0/P1` eligible gaps được address.
2. Mọi gap/phase/resource/prerequisite reference tồn tại.
3. Mọi learning phase có deliverable và acceptance criteria.
4. Tổng phase duration không vượt constraint/policy.
5. Không có phase duration âm/0 hoặc dependency cycle.
6. Resource IDs nằm trong approved catalog và chưa stale theo policy.
7. Candidate text không chứa score/internal field/PII pattern bị cấm.
8. Candidate text không hứa chắc chắn được tuyển.
9. Không biến `NOT_EVIDENCED` thành câu khẳng định ứng viên không biết.
10. `delivery_status` và candidate view nhất quán: invalid output phải `BLOCKED`; review draft phải `REVIEW_REQUIRED`; chỉ validated + policy-approved output mới `ELIGIBLE`.

Validation fail:

- Một lần retry LLM với danh sách validation errors đã sanitize.
- Nếu vẫn fail: `NEEDS_HUMAN_REVIEW` hoặc `FAILED` tùy có skeleton an toàn hay không.
- Không trả candidate view.

### 6.7. `renderer.py`

Renderer là deterministic allowlist:

- Nhận validated internal output.
- Chọn field an toàn để tạo `CandidateCareerPathView`.
- Map `NOT_EVIDENCED` thành phrasing “hồ sơ hiện chưa thể hiện rõ...”.
- Dùng language template `vi`/`en` được kiểm soát.
- Không render arbitrary `approved_rationale` hoặc `hr_recommendation`.
- Có thể tạo reviewer-visible candidate draft sau validator pass, nhưng renderer không tự đặt `delivery_status=ELIGIBLE`; quyền này do policy gate trong agent quyết định.
- Escape/sanitize text trước khi downstream render HTML/email; email HTML encoding cuối cùng vẫn thuộc backend/template layer.

### 6.8. `agent.py`

Theo pattern matcher:

- `SYSTEM_INSTRUCTION` và `PROMPT_VERSION` đặt ở module.
- `class CareerPathAgent`.
- Singleton `career_path_agent = CareerPathAgent()`.
- Public API: `async def generate(request: CareerPathRequest) -> CareerPathOutput`.

Pipeline trong `generate()`:

```text
validate applicability/input
  → analyze gaps
  → prioritize
  → resolve resources
  → build skeleton
  → call model if enabled/configured
  → parse CareerPathDraft
  → merge protected fields
  → validate
  → retry once if configured
  → render candidate view only when safe
  → attach diagnostics/provenance
```

Model call:

- Dùng `settings.LLM_MODEL_NAME`, không hardcode model riêng trong source.
- `response_mime_type="application/json"`.
- `response_schema=CareerPathDraft.model_json_schema()`.
- Chạy blocking SDK call trong executor/`asyncio.to_thread` và bọc timeout.
- Parse bằng `json.loads` rồi Pydantic.
- Log request/application ID và duration; không log CV, PII hoặc full prompt.
- Không có tool/function calling.

## 7. Applicability và failure behavior

Applicability guard nên là hàm deterministic đầu tiên. Bảng hành vi:

| Input | Status | Delivery | Internal draft | Candidate draft |
|---|---|---|---:|---:|
| Decision accepted/pending | `NOT_APPLICABLE` | `BLOCKED` | Không | Không |
| Reject chưa final | `NEEDS_HUMAN_REVIEW` | `BLOCKED` | Không | Không |
| Reject reason không nằm trong policy | `NOT_APPLICABLE` | `BLOCKED` | Không | Không |
| Extractor `FAILED` | `INSUFFICIENT_INPUT` | `BLOCKED` | Không | Không |
| Matcher `ERROR` | `INSUFFICIENT_INPUT` | `BLOCKED` | Không | Không |
| Job config không có competency | `INSUFFICIENT_INPUT` | `BLOCKED` | Không | Không |
| Không có learnable gap | `NOT_APPLICABLE` hoặc review warning | `BLOCKED` | Không | Không |
| Evidence critical mâu thuẫn | `NEEDS_HUMAN_REVIEW` | `BLOCKED` | Có assessment skeleton | Không |
| LLM/API key thiếu nhưng deterministic skeleton có | `NEEDS_HUMAN_REVIEW` | `BLOCKED` | Có | Không |
| LLM timeout/invalid JSON, retry fail | `NEEDS_HUMAN_REVIEW` nếu skeleton an toàn, ngược lại `FAILED` | `BLOCKED` | Tùy | Không |
| Validated result, policy yêu cầu HR review | `NEEDS_HUMAN_REVIEW` | `REVIEW_REQUIRED` | Có | Có |
| Validated result, đủ điều kiện phát | `GENERATED` | `ELIGIBLE` | Có | Có |

Agent không raise exception cho domain failure dự kiến. Exception lập trình/hạ tầng ngoài dự kiến được log có redaction và chuyển thành response `FAILED` hoặc route-specific HTTP 500 tùy layer.

## 8. Config và environment

### 8.1. `app/core/config.py`

Thêm technical settings tối thiểu:

- `CAREER_PATH_ENABLED: bool = False`.
- `CAREER_PATH_TIMEOUT_SECONDS: int = 45`.
- `CAREER_PATH_MAX_RETRIES: int = 1`.
- `CAREER_PATH_TEMPERATURE: float = 0.2`.

Dùng chung `GOOGLE_API_KEY` và `LLM_MODEL_NAME` với service hiện tại. Không thêm business threshold/duration vào environment; chúng thuộc `PlanningPolicy` có version.

### 8.2. `.env.example`

Thêm các key trên với giá trị local-safe. Không sửa hoặc commit `.env` thật.

### 8.3. `requirements.txt` và `docker-compose.yml`

- `requirements.txt`: không đổi trong MVP.
- `docker-compose.yml`: không cần đổi vì `env_file` đã inject settings. Chỉ thêm explicit environment nếu deployment yêu cầu override feature flag; không hardcode API key.

## 9. Prompt design

### 9.1. Prompt payload

Chỉ gửi:

- Target role/family/level.
- Gap IDs, tên competency, target level description, fixed priority/action mode.
- Evidence summaries đã sanitize và confidence.
- Candidate learning constraints.
- Roadmap skeleton constraints.
- Approved resource candidates với fixed IDs.
- Exact output schema/rules.

Không gửi:

- `personal_info`.
- Raw CV text.
- Overall/sub-scores hoặc pedigree bonus.
- `hr_recommendation`, hidden preferences.
- Decision rationale không được candidate-safe.
- Resource ngoài catalog.

Matcher evidence vẫn là untrusted content vì có thể chứa text bắt nguồn từ CV. Prompt phải đặt phần này trong block dữ liệu được gắn nhãn `UNTRUSTED_EVIDENCE`, yêu cầu không làm theo instruction bên trong. Đây là mitigation chứ không phải bảo đảm duy nhất; validator và việc model không có tools mới là control chính.

### 9.2. System instruction

Phải quy định:

- Không thay đổi IDs/priority/target.
- Không kết luận thiếu năng lực chỉ vì không có evidence.
- Không tạo resource/link.
- Không đưa score/reason nội bộ.
- Mỗi phase phải có activity, deliverable, assessment.
- Không hứa tuyển dụng.
- Chỉ trả JSON theo schema.

### 9.3. Versioning

- `PROMPT_VERSION` là constant có semantic version.
- Mọi output lưu prompt/model/agent version.
- Đổi prompt làm thay đổi hành vi phải chạy lại golden eval và bump version.

## 10. REST endpoint trong `app/main.py`

Thêm endpoint theo style hiện tại:

```text
POST /generate-career-path
request: CareerPathRequest JSON
response: CareerPathOutput
```

Quy ước HTTP:

- Request không đúng Pydantic schema: `422`.
- Domain status (`NOT_APPLICABLE`, `INSUFFICIENT_INPUT`, `NEEDS_HUMAN_REVIEW`, `GENERATED`): `200`, status nằm trong body.
- Unexpected service/programming error: `500` với error body không lộ stack trace/secret.

Lưu ý bắt buộc: global exception handler hiện trả body có shape `CVExtractionResponse` cho mọi exception. Endpoint Career Path phải catch/convert exception theo đúng response hoặc global handler cần được refactor thành generic `ApiErrorResponse`. Phải có test bảo đảm lỗi Career Path không trả nhầm extraction payload.

Endpoint standalone là integration point đầu tiên. Nó cho phép backend/test harness gọi agent mà không phải giả lập human pause trong graph.

Endpoint này là service-to-service API, không phải public candidate API. AI service hiện chưa có authentication và đang cấu hình CORS rộng; trước production phải đặt endpoint sau backend/API gateway hoặc thêm service authentication/authorization. Không dùng CORS như access control và không để client ứng viên gửi decision/job/matcher snapshots trực tiếp.

## 11. LangGraph integration

Chỉ thực hiện sau khi standalone endpoint/core tests ổn định.

### 11.1. Mở rộng `AgentState`

Thêm:

- `job_configuration: JobConfiguration | None`.
- `job_snapshot: CareerPathJobSnapshot | None` sau bước enrich.
- `decision: DecisionSnapshot | None`.
- `candidate_constraints: CandidateConstraints | None`.
- `planning_policy: PlanningPolicy | None`.
- `approved_resources: list[ApprovedLearningResource]`.
- `career_path_result: CareerPathOutput | None`.

State field chưa có ở endpoint cũ phải được xử lý optional rõ ràng, không truy cập trực tiếp bằng `state["..."]` nếu có thể thiếu.

### 11.2. Sửa matcher input

`match_node()` phải truyền `job_configuration=state.get("job_configuration")`. Nếu không có strict config, flow chỉ mang tính legacy analysis và không đủ điều kiện chạy Career Path. Sau matcher, adapter enrich `CareerPathJobSnapshot` bằng level descriptions đã tra cứu/freeze; Career Path node không tự gọi KB trong lúc planning.

### 11.3. Career path node

Thay placeholder bằng async node:

- Build `CareerPathRequest` từ state.
- Gọi snapshot adapter để loại PII/internal-only fields trước khi tạo request.
- Dùng enriched `job_snapshot`; không truyền bare level number cho planner.
- Gọi `await career_path_agent.generate(request)`.
- Trả `{"career_path_result": result}`.
- Không persist/send email trong node.

### 11.4. Routing theo decision

Thay `check_score()` cho Career Path bằng decision router:

- Không có final decision → `human_review`/END.
- Accepted → END/acceptance flow ngoài phạm vi.
- Rejected + applicable reason → `career_path`.
- Rejected + non-applicable reason → END/template flow.
- Upstream error → review/error path.

Score và `is_high_potential` vẫn có thể hỗ trợ HR review nhưng không được là điều kiện duy nhất gọi Career Path.

### 11.5. Human-in-the-loop thực tế

`MemorySaver` in-memory không đủ cho production decision chờ lâu. Kế hoạch integration ưu tiên:

1. Screening flow kết thúc và backend persist artifacts.
2. HR/backend tạo final decision.
3. Backend gọi post-decision Career Path endpoint bằng snapshots.

Graph resume chỉ thực hiện khi có persistent checkpointer và contract được kiểm thử. Không để việc hoàn thành Career Path phụ thuộc vào thread in-memory.

Nếu vẫn dùng `thread_id`, phải dùng application/correlation ID riêng, không dùng constant `"1"`.

## 12. Backend integration dependencies

Career Path coding trong AI service có thể hoàn tất độc lập bằng request fixture. Để chạy end-to-end, backend cần cung cấp:

- Application ID thực.
- Final decision record và reason codes.
- Job snapshot đầy đủ, gồm semantic description của required level cho từng critical competency.
- CV extraction snapshot.
- Matching output/evidence snapshot.
- Planning policy snapshot.
- Approved resource snapshot/catalog version.
- Nơi persist versioned CareerPathOutput và candidate view.
- Service-to-service identity/authorization cho API Career Path.

Current backend mới có `Application.fitScore`, `aiFeedback` và `scoringBreakdown`; chưa đủ lưu toàn bộ artifacts. Không nhét tạm toàn bộ roadmap vào `aiFeedback` rồi coi là hoàn tất production.

Contract REST/RabbitMQ sau này phải có correlation ID, idempotency key, schema version và retry/dead-letter policy. Agent không cần biết transport nào được chọn.

## 13. Kế hoạch test

### 13.1. Fixture strategy

Thêm fixture không chứa PII thật:

- Job configuration Engineering/MID có hard skill, soft skill, experience và pedigree.
- CV extraction success/partial/failed.
- Matcher result đầy đủ, early knockout, missing matrix, error và contradictory evidence.
- Final HR reject, auto-policy reject, accepted, pending và administrative reject.
- Candidate constraints/policy/resources.
- Prompt injection strings trong evidence.

Fixture IDs ổn định để assert exact gap references. Không gọi model/embedding/backend thật trong unit tests.

### 13.2. `test_career_path_gap_analyzer.py`

Test tối thiểu:

- Join competency theo ID.
- `meets=true` → `MET`.
- Partial evidence → `PARTIAL`.
- Low/no evidence → `NOT_EVIDENCED`, phrasing không khẳng định thiếu skill.
- Missing/contradictory evidence → `UNKNOWN`.
- Vector fallback chỉ cho hard skill và bật review flag.
- Pedigree bị loại khỏi learnable gaps.
- Early knockout thiếu matrix/breakdown không làm mất các competency còn lại vì job snapshot là danh sách chuẩn; case này được gắn review.
- Không giả observed level.

Thêm test cho snapshot adapter (có thể tách thành `test_career_path_snapshot_adapter.py`):

- Candidate snapshot không chứa name/email/phone/location.
- Matching snapshot không chứa HR recommendation, overall/sub-scores, potential flags hoặc pedigree rules.
- Adapter không mutate `CVExtractionResponse`/`MatchingOutput` gốc.
- Version/evidence path được copy và chuẩn hóa đúng.
- Job snapshot loại institutional rules và freeze đúng required-level descriptions.
- Thiếu level description ở critical competency tạo quality error/review, không để model tự đoán.

### 13.3. `test_career_path_prioritization.py`

- Mandatory gap là `P0`.
- Reason-linked/high criticality là `P1`.
- Remaining gaps là `P2`, order ổn định.
- Unknown mandatory giữ `P0` nhưng action mode `ASSESS_FIRST`.
- Soft skill thiếu keyword không bị gắn `LEARN` trực tiếp.
- Experience gap không có phrasing thay thế số năm phi thực tế.
- Thứ tự input thay đổi không làm đổi priority result.

### 13.4. `test_career_path_validator.py`

- Pass với plan hợp lệ.
- Fail khi thiếu P0/P1 coverage.
- Fail unknown gap/resource/prerequisite reference.
- Detect dependency cycle.
- Fail duration vượt policy.
- Fail resource stale/outside catalog.
- Fail learning phase thiếu deliverable/acceptance criteria.
- Fail candidate view chứa score, internal field, email/phone hoặc lời hứa tuyển dụng.
- Fail khi `delivery_status` không nhất quán với validation/policy; review draft có thể tồn tại nhưng không được `ELIGIBLE`.

### 13.5. `test_career_path_agent.py`

Mock model/call boundary:

- Valid JSON → validated `GENERATED` khi policy cho phép.
- Policy yêu cầu review → `NEEDS_HUMAN_REVIEW`, candidate draft có thể có nhưng delivery là `REVIEW_REQUIRED`.
- Missing API key/model disabled → deterministic internal skeleton + review.
- Timeout → retry đúng số lần rồi fail closed.
- Invalid JSON/Pydantic → retry rồi fail closed.
- Valid JSON nhưng vi phạm coverage → validator retry.
- LLM cố thay gap ID/priority/resource → merge/validator từ chối.
- LLM exception không lộ exception/secret trong candidate output.
- Request/prompt payload không có `personal_info`, score, HR recommendation hoặc hidden preferences.
- Same input tạo cùng protected skeleton dù LLM wording khác.
- Chỉ policy-approved result mới có `delivery_status=ELIGIBLE`.

### 13.6. `test_career_path_api.py`

- Valid request trả response model.
- Invalid request trả `422`.
- Accepted/non-applicable trả domain status đúng.
- Unexpected error không trả CV extraction-shaped body.
- Feature flag off fail closed.
- Không log/echo PII trong error response.
- Request schema không nhận client-supplied HR-only/raw upstream fields ngoài allowlist.

### 13.7. `test_career_path_orchestrator.py`

- Final rejected applicable gọi Career Path đúng một lần.
- Accepted không gọi.
- No final decision không gọi.
- Matcher error không gọi.
- `job_configuration` được truyền vào matcher.
- Enriched job snapshot được truyền vào Career Path Agent.
- `career_path_result` xuất hiện trong final state/response.
- Thread/correlation identity không dùng constant chung.

### 13.8. Security và metamorphic tests

- Evidence chứa “ignore previous instructions” không đổi fixed priority/IDs.
- Evidence chứa URL lạ không xuất hiện thành resource.
- Đổi candidate name/gender-coded cue/location không đổi critical gaps/phases; tốt nhất các field này không vào planner prompt.
- Đảo order evidence/competencies không đổi protected plan ngoài thứ tự canonical.
- Vietnamese/English rendering không làm lộ internal fields.
- Candidate draft ở trạng thái review không được backend test double gửi khi delivery chưa `ELIGIBLE`.

### 13.9. Test commands khi code được triển khai

```powershell
cd ai-service
python -m pytest tests/test_career_path_gap_analyzer.py -q
python -m pytest tests/test_career_path_snapshot_adapter.py -q
python -m pytest tests/test_career_path_prioritization.py -q
python -m pytest tests/test_career_path_validator.py -q
python -m pytest tests/test_career_path_agent.py -q
python -m pytest tests/test_career_path_api.py -q
python -m pytest tests/test_career_path_orchestrator.py -q
python -m pytest -q
ruff check app tests
```

CI tests không được gọi Gemini thật. Một smoke test live model có thể chạy thủ công bằng flag riêng và không thuộc release unit suite.

## 14. Thứ tự coding và PR breakdown

### PR 1 — Contract và deterministic gap core

Files:

- `app/core/schemas.py`.
- `career_path_agent/snapshot_adapter.py`.
- `career_path_agent/gap_analyzer.py`.
- `career_path_agent/prioritization_engine.py`.
- `tests/conftest.py` và ba test module cho adapter/gap/prioritization.

Các bước:

1. Thêm enums/input/internal/output models với validators.
2. Tạo fixture Job/CV/Matcher/Decision/Policy.
3. Implement allowlisted snapshot adapter và privacy tests.
4. Implement applicability helper hoặc đặt tạm trong gap analyzer.
5. Implement gap join và evidence references.
6. Implement priority/action mode.
7. Unit test toàn bộ rule và edge cases.

Exit gate:

- Không có LLM code.
- Gap/priority deterministic, order ổn định.
- Pedigree/PII không trở thành gap.
- Career Path request không mang `personal_info`/direct-contact PII hoặc HR-only matcher fields; experience/education vẫn được coi là dữ liệu cá nhân cần bảo vệ.
- Critical competency có semantic level target đã freeze.
- Test contract và core pass.

### PR 2 — Roadmap skeleton, resources, validator và renderer

Files:

- `roadmap_builder.py`.
- `resource_catalog.py`.
- `roadmap_validator.py`.
- `renderer.py`.
- Các test tương ứng.

Các bước:

1. Resolve constraints/policy.
2. Build phase skeleton bao phủ P0/P1.
3. Implement approved resource lookup.
4. Implement structural/safety validators.
5. Implement allowlisted candidate renderer.
6. Tạo deterministic internal draft cho no-model mode.
7. Implement `DeliveryStatus` gate tách reviewer draft khỏi auto-delivery.

Exit gate:

- Với fixture chuẩn có thể tạo và validate internal roadmap mà không gọi LLM.
- No-model output không có candidate view tự động.
- Review draft không được đánh dấu `ELIGIBLE` nếu policy chưa cho phép.
- Validator bắt được toàn bộ critical invariant trong test matrix.

### PR 3 — LLM CareerPathAgent

Files:

- `career_path_agent/agent.py`.
- `app/core/config.py`.
- `.env.example`.
- `test_career_path_agent.py`.

Các bước:

1. System instruction/prompt version.
2. Sanitized prompt builder từ gap/skeleton.
3. Async wrapper, timeout, bounded retry.
4. Structured JSON/Pydantic parsing.
5. Protected merge, validation retry và final status.
6. Diagnostics/provenance.
7. Mock-based failure/security tests.

Exit gate:

- Không có live network trong tests.
- Model không thể đổi protected fields.
- Timeout/invalid output/missing key đều fail closed.
- Candidate view chỉ có sau validator pass và policy cho phép.

### PR 4 — Standalone API

Files:

- `app/main.py`.
- Có thể thêm generic error schema trong `app/core/schemas.py`.
- `test_career_path_api.py`.

Các bước:

1. `POST /generate-career-path`.
2. Response/error handling đúng shape.
3. Feature flag.
4. API tests.

Exit gate:

- Backend/test harness có thể gọi module bằng JSON contract.
- Không phụ thuộc graph hoặc DB.
- Global error handler không làm sai response shape.

### PR 5 — Decision-gated graph integration

Files:

- `app/agents/orchestrator.py`.
- `app/main.py` nếu mở rộng process response.
- `test_career_path_orchestrator.py`.

Các bước:

1. Mở rộng state.
2. Truyền strict job configuration vào matcher.
3. Implement async Career Path node.
4. Decision router thay score router cho Career Path.
5. Dùng application/correlation ID cho thread.
6. Trả `career_path_result` trong response phù hợp.

Exit gate:

- Không có final reject thì Career Path không chạy.
- Accepted/matcher error không chạy.
- Full integration test pass.

### PR 6 — Offline evaluation và shadow readiness

Files:

- `evals/career_path/*`.
- Seed JSONL và evaluation runner.
- Documentation về annotation/rubric.

Các bước:

1. Import golden cases đã adjudicate.
2. Code evaluator cho hard invariants/metrics.
3. Report theo reason/job family/level/language/data quality.
4. Lưu model/prompt/agent version trên mỗi run.
5. Chuẩn bị format reviewer edit diff/feedback.

Exit gate:

- Release gate trong tài liệu phân tích được tính tự động nơi có thể.
- Human rubric workflow rõ ràng.
- Chưa auto-send trước shadow approval.

## 15. Mapping yêu cầu sang code và test

| Yêu cầu | Module chính | Test bắt buộc |
|---|---|---|
| Chỉ chạy sau final reject | applicability/agent/orchestrator | accepted, pending, non-final reject |
| Không coi absence là lack | gap analyzer/renderer | no evidence phrasing |
| Mandatory gap ưu tiên | prioritization engine | P0 tests |
| Assessment-first khi uncertain | gap analyzer/prioritizer/builder | unknown/low confidence |
| Không dùng pedigree | snapshot adapter/gap analyzer | institutional rule và pedigree exclusion |
| Không bịa resource | resource catalog/validator | unknown URL/ID |
| Mọi milestone đo được | builder/validator | deliverable + criteria |
| Không lộ internal data | snapshot adapter/prompt builder/renderer/validator | score/HR preference/PII tests |
| LLM fail closed | agent | no key, timeout, invalid JSON |
| Trace/version | agent/output | provenance assertions |
| Không route bằng score | orchestrator | low score without decision does not invoke |
| Candidate view và quyền gửi tách biệt | renderer/agent | status/view/delivery matrix |

## 16. Logging, observability và privacy

Logging theo style `logging.getLogger(__name__)`, nhưng dùng parameterized logging thay vì ghép full payload.

Log được phép:

- Request/application ID.
- Status/stage.
- Gap/phase count.
- Validator error codes.
- Model/prompt/agent version.
- Retry count, latency.

Không log:

- CV content/evidence đầy đủ.
- Personal info.
- Full prompt/model response.
- API key/credential.
- Hidden HR preference/rationale nhạy cảm.

Metric tối thiểu:

- Request count theo status.
- Latency deterministic/LLM/total.
- Retry/timeout/parse/validation failure count.
- Critical gap coverage và assessment completeness.
- Human review required rate.
- Model/prompt version distribution.

Tracing bên thứ ba chỉ bật sau khi có quyết định PII/redaction và retention.

## 17. Rủi ro coding và cách kiểm soát

| Rủi ro | Kiểm soát trong kế hoạch |
|---|---|
| Schema quá lớn làm `schemas.py` khó bảo trì | Giữ nhất quán trong MVP; đặt section rõ, sau đó tách module trong một refactor riêng nếu vượt ngưỡng thống nhất |
| LLM sửa business rule | Draft schema hẹp, protected merge và validator |
| Upstream evidence thiếu | `UNKNOWN`/`ASSESS_FIRST`, review flag, không đoán |
| Early knockout không có matrix | Vector fallback có provenance và bắt buộc review |
| Link/resource bịa | Approved resource IDs only |
| Global error handler trả sai shape | Route-specific handling + API regression test |
| FastAPI event loop bị block | Executor/to-thread + timeout |
| Retry gây duplicate/cost | Idempotency key, bounded retry, không side effect trong agent |
| Graph chạy nhầm trước quyết định | Standalone contract trước, decision router sau |
| In-memory checkpoint mất state | Backend persist + post-decision call; không coi MemorySaver là production persistence |
| PII/prompt injection | Sanitized payload, untrusted block, no tools, allowlisted renderer, adversarial tests |
| Endpoint chứa dữ liệu tuyển dụng bị gọi trực tiếp | Internal-only route, service auth/API gateway và backend-owned request assembly |
| Test vô tình tải model/gọi mạng | Patch model boundary, deterministic fixtures |

## 18. Definition of Done cho phần code

Phần Career Path Agent chỉ được xem là code-complete khi:

- Tất cả models parse/serialize đúng và có schema version.
- Applicability guard fail closed cho mọi non-final/non-applicable/error case.
- Gap analyzer/priority/builder/validator test độc lập, không cần LLM.
- Không có business-critical decision chỉ tồn tại trong prompt.
- Snapshot adapter loại `personal_info`/direct-contact identifiers và HR-only fields trước agent boundary.
- LLM output bị giới hạn bởi draft schema và protected merge.
- No-key/timeout/invalid-output có status đúng, không có candidate view.
- Candidate view không chứa PII/internal fields và chỉ được tạo sau validation.
- Candidate draft review và quyền delivery được tách bằng `DeliveryStatus`; backend chỉ gửi `ELIGIBLE`.
- Standalone endpoint có contract/error response đúng.
- Endpoint được bảo vệ như service-to-service API trước production.
- Graph chỉ gọi agent sau final reject; không dùng score thấp làm final decision.
- Unit/API/integration/security tests pass; không có live network trong CI.
- Ruff pass theo config hiện tại.
- Output có provenance và validation diagnostics.
- Có seed evaluation cases và report hard metrics trước shadow mode.
- Không sửa `.env` thật, không hardcode credential/model ID mới.

## 19. Các điểm cần xác nhận trước khi bắt đầu PR tương ứng

Không chặn PR 1-3 nếu dùng fixture policy, nhưng phải chốt trước API/production integration:

1. Danh sách reason codes áp dụng được.
2. Auto-policy reject có được coi là final hay cần HR confirm.
3. Planning defaults: giờ/tuần, duration, max phases.
4. Job families/career levels đầu tiên được hỗ trợ.
5. Nguồn và owner của required-level descriptions.
6. Có resource catalog ngay MVP hay chấp nhận roadmap không link.
7. Khi nào output được `delivery_status=ELIGIBLE`; khi nào bắt buộc `REVIEW_REQUIRED`.
8. Backend sẽ gửi sanitized snapshots hay orchestrator dùng snapshot adapter từ raw upstream objects.
9. Cách persist plan version và decision reference.
10. Ngôn ngữ/disclaimer candidate-facing được HR duyệt.

Nếu chưa chốt, code phải giữ `CAREER_PATH_ENABLED=false` và `allow_candidate_auto_delivery=false`.

## 20. Kết quả tự kiểm duyệt kế hoạch

Kế hoạch đã được đối chiếu lại với codebase và chỉnh theo các điểm sau:

- Thư mục `career_path_agent` hiện tồn tại nhưng rỗng; file tree đề xuất không đè lên code người khác.
- Structure dùng `agent.py` façade/singleton, centralized schemas/config và flat pytest modules giống các agent hiện có.
- MVP không yêu cầu dependency mới và không sửa `.env` thật.
- Kế hoạch không dùng `missing_criteria` làm toàn bộ ground truth; vẫn ưu tiên evidence matrix và quality flags.
- Kế hoạch xử lý trường hợp early knockout không có full evidence/breakdown bằng review, không bịa gap certainty.
- Kế hoạch không truyền bare `required_level`; `CareerPathJobSnapshot` phải freeze semantic level description trước planning.
- Kế hoạch không nối Career Path vào nhánh `overall_score < 50` hiện tại.
- Standalone endpoint được thực hiện trước graph để không giả lập human pause bằng `MemorySaver`.
- Business rules nằm ở deterministic modules/policy snapshot, không chỉ ở prompt.
- LLM chỉ sinh draft, không thể sửa decision/ID/priority/resource/provenance.
- Snapshot adapter loại `personal_info`, direct-contact identifiers, score, HR recommendation và pedigree rules không cần thiết trước agent boundary; các resume facts còn lại vẫn chịu chính sách dữ liệu cá nhân.
- Candidate view được tách và allowlist; `DeliveryStatus` ngăn reviewer draft bị coi là auto-send eligible.
- Failure behavior, file changes, PR order, test matrix và exit gate đã được nêu cụ thể.
- Đã lưu ý global exception handler hiện trả extraction-shaped body và yêu cầu regression test khi thêm endpoint mới.
- Đã ghi rõ endpoint phải là service-to-service và AI service hiện chưa có auth phù hợp cho production.
- Backend/persistence/email được ghi là integration dependency, không được mô tả như đã có.

Thứ tự nên bắt đầu là **PR 1 → PR 2 → PR 3 → PR 4**, sau đó mới tích hợp graph/backend. Cách này tạo được một Career Path core kiểm chứng độc lập trước khi phụ thuộc vào luồng ứng tuyển còn thiếu ở backend hiện tại.
