# Kế hoạch phát triển API cho Admin Dashboard

> **Trạng thái 29/07/2026:** Cả 5 phase đã được triển khai và tích hợp vào frontend. Toàn bộ Admin Dashboard hiện dùng API thật; production path không còn fallback sang mock.
>
> Phạm vi được xác định từ code frontend admin hiện tại, không lấy các ý tưởng cũ trong tài liệu thiết kế làm yêu cầu mặc định.
>
> Mục tiêu: hoàn thiện toàn bộ API mà giao diện `/admin` đang cần trong tối đa 5 phase, ưu tiên phần dễ trước, phần liên dịch vụ và tổng hợp dữ liệu sau.

## 1. Kết luận sau khi khảo sát codebase

Frontend admin hiện có 7 khu vực:

1. Dashboard: `/admin/dashboard`
2. Tài khoản: `/admin/users`, `/admin/users/[userId]`
3. Tin tuyển dụng: `/admin/jobs`, `/admin/jobs/[jobId]`
4. Xử lý hồ sơ AI: `/admin/applications`, `/admin/applications/[applicationId]`
5. Kho năng lực: `/admin/knowledge`, `/admin/knowledge/competencies/[competencyId]`
6. Nhật ký: `/admin/activity`
7. Báo cáo: `/admin/reports`

Tại thời điểm khảo sát ban đầu, frontend còn dùng `mockAdminService` và backend chưa có boundary `/api/v1/admin/**`. Đây là baseline lịch sử dùng để giải thích lý do chia phase, không còn là trạng thái hiện tại.

Trạng thái hiện tại sau 5 phase và đợt rà soát hoàn thiện:

- `frontend/src/services/admin.service.ts` dùng HTTP cho toàn bộ 19 thao tác của `AdminService`; không còn fallback mock trong production composition.
- HTTP implementation đã được tách theo Dashboard, User, Job, Knowledge, Application và Activity thay vì dồn vào một file lớn.
- Backend có đủ 21 operation dưới `/api/v1/admin/**`, được bảo vệ bằng `ROLE_ADMIN`.
- Bốn API vòng đời JWT gồm login, `me`, refresh và logout đã được tích hợp vào frontend.
- User, Job, Application dùng filter và phân trang phía server; Knowledge dùng API ghi thật; Dashboard và Reports dùng aggregate API chung.
- Activity log ghi mutation quản trị và sự kiện AI; retry AI dùng outbox/RabbitMQ và dữ liệu tiến trình được lưu bền vững.

Kế hoạch này gồm 21 endpoint admin, 4 endpoint vòng đời JWT dùng chung và 5 phase triển khai đã hoàn thành.

## 2. Nguồn sự thật và phạm vi

### 2.1. Nguồn sự thật

Thứ tự ưu tiên khi có mâu thuẫn:

1. Hành vi đang có trong `frontend/src/features/admin`.
2. `AdminService` tại `frontend/src/services/contracts/admin-service.ts`.
3. Backend/schema hiện tại.
4. Tài liệu `docs/admin_dashboard_design.md` và `docs/admin_dashboard_plan.md`.

Hai tài liệu frontend cũ từng đề cập xác minh HR, duyệt/từ chối/ẩn Job. Các action này không còn xuất hiện trên giao diện admin hiện tại nên không đưa vào kế hoạch API này.

### 2.2. Có trong scope

- Đăng nhập, lấy admin hiện tại, refresh và logout.
- Chặn truy cập `/admin` nếu không phải `ADMIN`.
- Tìm kiếm/lọc/phân trang/sắp xếp user, job, application và activity.
- Khóa/mở tài khoản, bắt buộc ghi lý do.
- Admin chỉ đọc và giám sát Job.
- Admin chỉ xem metadata kỹ thuật của Application/AI.
- Retry AI bất đồng bộ, không thay đổi trạng thái tuyển dụng.
- CRUD mềm cho Job Family, Career Level, Competency và cập nhật đủ 5 competency levels.
- Dashboard và Reports dùng chung một nguồn dữ liệu tổng hợp.
- Activity log cho các mutation admin và sự kiện AI liên quan.

### 2.3. Không có trong scope hiện tại

- Admin duyệt, từ chối, ẩn hoặc sửa Job.
- Admin xác minh HR.
- Admin sửa điểm AI hoặc quyết định tuyển dụng.
- Admin xem raw CV, nội dung CV đã trích xuất, score breakdown, nhận xét chuyên môn hoặc Career Path.
- Export PDF/CSV cho Reports.
- Notification/unread API riêng. Icon chuông hiện chỉ dẫn tới `/admin/activity`.
- API đổi mock scenario hoặc reset demo data.
- Pedigree và Institutional Rule vì frontend admin hiện chưa có màn hình tương ứng.

Nếu cần các chức năng ở nhóm này, phải bổ sung UI/contract trước rồi mới mở rộng API; không ghép ngầm vào kế hoạch hiện tại.

## 3. Các chênh lệch ban đầu đã được xử lý

| Khu vực | Frontend cần | Backend hiện có | Hướng xử lý |
|---|---|---|---|
| Auth | Admin hiện tại, route guard, logout | Login trả JWT nhưng frontend chưa dùng; chưa có `me`, refresh, logout | Hoàn thiện vòng đời xác thực JWT ở Phase 1 |
| User | `status`, `lastActiveAt`, staff profile, counts, `blockReason` | Chỉ có `is_active`, role và thông tin cơ bản | Bổ sung cột nullable, projection counts và audit |
| Job | 4 status, department, openings, family/level, competencies, readiness, counts | Chủ yếu dùng `is_active`; thiếu một số field hiển thị | Migration và DTO/projection riêng |
| Application | AI status, confidence, extraction method, warnings, pipeline, retry | Chỉ có recruitment status, fit score, feedback | Thêm AI run/step model và callback từ AI service |
| Knowledge | CRUD/status/usage count cho family, career level, competency | Có entity, nhưng thiếu status và phần lớn API ghi | Bổ sung `is_active`, admin service và endpoint |
| Activity | Danh sách, filter, thống kê, activity theo user | Chưa có bảng | Tạo `activity_logs` và recorder dùng chung |
| Dashboard | Aggregate 7/30 ngày | Chưa có | Query tổng hợp sau khi các nguồn dữ liệu ổn định |

Một số model frontend cũng phải sửa:

- `aiConfidence` và `extractionMethod` phải nullable khi hồ sơ chưa được AI xử lý.
- Danh sách user/application phải chuyển từ array sang response có phân trang.
- `DataTable` phải hỗ trợ controlled pagination/sorting từ server; hiện tại component chỉ phân trang client-side.
- Pipeline AI phải dùng dữ liệu thật từ backend, không tiếp tục suy diễn bằng timer và `buildAiPipeline()`.
- `CURRENT_ADMIN_ID` và tên admin hard-code phải được thay bằng identity lấy từ JWT/API `me`.

## 4. Quy ước API chung

### 4.1. Base path và response envelope

- Admin API mới: `/api/v1/admin/**`.
- Auth giữ base path hiện tại `/api/auth/**` để tránh phá endpoint đang có.
- Giữ envelope hiện có:

```json
{
  "code": 1000,
  "message": "Success",
  "result": {}
}
```

Response phân trang:

```json
{
  "items": [],
  "page": 0,
  "size": 8,
  "totalItems": 0,
  "totalPages": 0
}
```

Quy ước:

- `page` bắt đầu từ `0`.
- `size` mặc định `8` để khớp UI hiện tại, tối đa `100`.
- Thời gian trả về ISO-8601 UTC.
- Enum dùng uppercase.
- Search tối đa 100 ký tự.
- Chỉ cho sort theo danh sách field được allow-list; không truyền trực tiếp tên field tùy ý vào query.
- `400`: request/validation sai.
- `401`: chưa đăng nhập hoặc token hết hạn.
- `403`: không phải Admin.
- `404`: không tìm thấy resource.
- `409`: xung đột trạng thái, tên trùng, item đang được sử dụng hoặc retry đang chạy.
- `202`: retry AI đã được nhận và xếp hàng.

### 4.2. Phân quyền và bảo mật

- Bật method security và bảo vệ toàn bộ `/api/v1/admin/**` bằng `hasRole('ADMIN')`.
- Không dùng Spring `HttpSession`; giữ `SessionCreationPolicy.STATELESS` và xác thực bằng JWT như code hiện tại.
- Không chỉ kiểm tra chữ ký/hạn JWT. Khi một user bị block, request tiếp theo của user đó phải bị từ chối dù access token cũ còn hạn.
- Cấm admin tự khóa tài khoản đang đăng nhập.
- Không trả `passwordHash`, token, raw CV, prompt, stack trace hoặc internal AI payload.
- Mutation phải lấy actor từ `SecurityContext`, không nhận `adminId` từ request body.
- Log chỉ lưu metadata đã sanitize; không lưu nội dung CV.
- Retry AI bắt buộc có `Idempotency-Key`.

### 4.3. Ranh giới frontend/backend

Backend trả dữ liệu nghiệp vụ, không trả màu, label tiếng Việt hoặc frontend route. Ví dụ Dashboard trả `blockedUsers=3`, không trả `"Cần rà soát"` hay `"/admin/users?status=BLOCKED"`.

`HttpAdminService` chịu trách nhiệm map DTO API sang model hiển thị hiện tại. Cách này giữ backend độc lập với UI và vẫn hạn chế thay đổi component.

### 4.4. Nguyên tắc tích hợp ngay sau mỗi API

Một API chỉ được đánh dấu hoàn thành khi đủ tất cả điều kiện:

1. Có migration/entity/repository/service/controller cần thiết.
2. Có OpenAPI contract và error code.
3. Có test success, validation, not-found/conflict và `401/403` phù hợp.
4. `HttpAdminService` đã gọi endpoint đó.
5. Query/mutation hook đã dùng HTTP thật.
6. Màn hình liên quan xử lý loading, empty, error và success.
7. Mock method tương ứng không còn là đường chạy mặc định.
8. Đã chạy backend tests, frontend lint/build và smoke test luồng UI.

Không triển khai hết backend rồi mới tích hợp frontend ở cuối phase.

Để chuyển đổi từng API mà không big-bang, `admin.service.ts` tạm thời compose theo từng method:

```text
method đã hoàn thành  -> HttpAdminService
method chưa làm       -> MockAdminService, chỉ trong dev
```

Sau Phase 5, production build không được phép fallback sang mock. Các demo control của khu vực Admin được gỡ khỏi đường chạy thật.

## 5. Danh mục API đầy đủ

### 5.1. API quản lý vòng đời JWT dùng chung

| ID | Method và path | Trạng thái | Frontend sử dụng |
|---|---|---|---|
| AUTH-01 | `POST /api/auth/login` | Đã triển khai và tích hợp | Trang login, điều hướng theo role |
| AUTH-02 | `GET /api/auth/me` | Đã triển khai và tích hợp | Route guard, topbar, chống tự khóa |
| AUTH-03 | `POST /api/auth/refresh` | Đã triển khai và tích hợp | Đổi refresh token lấy access token mới |
| AUTH-04 | `POST /api/auth/logout` | Đã triển khai và tích hợp | Thu hồi refresh token và kết thúc trạng thái đăng nhập |

`AUTH-02` trả tối thiểu:

```json
{
  "id": "uuid",
  "fullName": "Admin Nguyễn",
  "email": "admin@example.com",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

JWT không đồng nghĩa với việc ứng dụng không có “trạng thái đăng nhập” ở phía người dùng. Trong bản kế hoạch cũ, từ “session” được dùng theo nghĩa rộng là khoảng thời gian người dùng đang đăng nhập, không phải Spring `HttpSession`. Để tránh nhầm lẫn, kế hoạch từ đây dùng cụm “vòng đời JWT”.

Luồng đề xuất, vẫn hoàn toàn dùng JWT:

1. `AUTH-01` xác thực email/password và phát access JWT ngắn hạn.
2. Frontend gửi access JWT qua `Authorization: Bearer ...`.
3. `AUTH-03` dùng refresh JWT để phát cặp token mới; refresh token cũ bị rotate/revoke.
4. `AUTH-04` thu hồi refresh token. Frontend đồng thời xóa access token đang giữ.
5. Backend vẫn cấu hình stateless, không tạo `JSESSIONID`.

Khuyến nghị:

- Access JWT chỉ giữ trong memory của frontend và có TTL ngắn.
- Refresh JWT lưu bằng cookie `HttpOnly`, `Secure`, `SameSite`, không lưu trong `localStorage`.
- Lưu `jti`/refresh record trong Redis để rotate và revoke khi logout.
- Khi user bị block, `JwtFilter` kiểm tra `isActive` từ nguồn tin cậy trước khi cấp quyền. Với quy mô hiện tại, đọc user từ database là phương án đơn giản và rõ ràng; chỉ cache Redis khi đo được nhu cầu.

Nếu chỉ xóa token ở frontend mà không có `AUTH-04`, refresh token bị đánh cắp vẫn có thể dùng đến khi hết hạn. Nếu chỉ kiểm tra chữ ký như `JwtFilter` hiện tại, user vừa bị block vẫn dùng được access token cũ đến tối đa 24 giờ. Đây là lý do cần hoàn thiện vòng đời JWT, không phải chuyển sang server session.

### 5.2. User và Activity

| ID | Method và path | Query/body chính | Frontend sử dụng |
|---|---|---|---|
| USR-01 | `GET /api/v1/admin/users` | `search`, `role`, `status`, `page`, `size`, `sort` | `/admin/users` |
| USR-02 | `GET /api/v1/admin/users/{userId}` | Path UUID | `/admin/users/[userId]` |
| USR-03 | `PATCH /api/v1/admin/users/{userId}/status` | `{status, reason}` | Dialog khóa/mở tài khoản |
| ACT-01 | `GET /api/v1/admin/activities` | `search`, `group`, `targetType`, `targetId`, `from`, `to`, `page`, `size` | `/admin/activity`, tab activity của user |

User summary/detail:

```json
{
  "id": "uuid",
  "fullName": "Nguyễn Văn A",
  "email": "a@example.com",
  "role": "HR",
  "status": "ACTIVE",
  "employeeCode": "HR001",
  "departmentName": "Product",
  "jobTitle": "Talent Acquisition",
  "workLocation": "Hồ Chí Minh",
  "createdAt": "2026-07-28T10:00:00Z",
  "lastActiveAt": null,
  "jobsCount": 3,
  "applicationsCount": 0,
  "blockReason": null
}
```

`USR-03`:

```json
{
  "status": "BLOCKED",
  "reason": "Nhân sự đã nghỉ việc và cần thu hồi quyền truy cập."
}
```

Quy tắc:

- `reason` từ 8 đến 240 ký tự.
- `ACTIVE -> BLOCKED` và `BLOCKED -> ACTIVE`.
- Không tự khóa.
- Block phải làm access JWT cũ mất quyền sử dụng và thu hồi các refresh JWT còn hiệu lực.
- Mutation và activity log được ghi trong cùng transaction.
- Response trả user detail đã cập nhật.

`ACT-01` trả page result kèm:

```json
{
  "summary": {
    "total": 120,
    "last24Hours": 8,
    "aiRelated": 19
  }
}
```

Activity item gồm `id`, `kind`, `source`, `actorName`, `description`, `targetType`, `targetId`, `targetLabel`, `createdAt`. `HttpAdminService` tự tạo `targetHref` từ `targetType/targetId`.

Tab activity của user tái sử dụng `ACT-01` với `targetType=USER&targetId={userId}`; không tạo một endpoint trùng lặp.

### 5.3. Job monitoring

| ID | Method và path | Query chính | Frontend sử dụng |
|---|---|---|---|
| JOB-01 | `GET /api/v1/admin/jobs/filter-options` | Không có | Family/level filters trên `/admin/jobs` |
| JOB-02 | `GET /api/v1/admin/jobs` | `search`, `status`, `jobFamilyId`, `careerLevelId`, `readiness`, `page`, `size`, `sort` | `/admin/jobs` |
| JOB-03 | `GET /api/v1/admin/jobs/{jobId}` | Path UUID | `/admin/jobs/[jobId]` |

`JOB-01` chỉ trả dữ liệu filter cần thiết:

```json
{
  "jobFamilies": [{"id": "uuid", "name": "Engineering", "status": "ACTIVE"}],
  "careerLevels": [{"id": "uuid", "name": "Senior", "status": "ACTIVE"}]
}
```

Không dùng toàn bộ Knowledge Overview chỉ để dựng filter Job.

`JOB-02` trả:

```json
{
  "items": [],
  "statusCounts": {
    "DRAFT": 0,
    "OPEN": 0,
    "PAUSED": 0,
    "CLOSED": 0
  },
  "page": 0,
  "size": 8,
  "totalItems": 0,
  "totalPages": 0
}
```

`statusCounts` áp dụng search/family/level/readiness hiện tại nhưng bỏ qua riêng filter `status`, đúng hành vi các tab hiện tại.

Job item/detail phải đủ:

- Thông tin Job và owner.
- `applicationCount`, `aiCompletedCount`, `aiFailedCount`.
- Job Family, Career Level.
- Competency requirements.
- `matchingReady` và `readinessIssues`.
- `status`, `createdAt`, `expiresAt`.

Readiness được tính theo cùng rule frontend hiện tại:

- Có title, description và requirements.
- Có Job Family và Career Level.
- Có ít nhất một competency.
- Required level thuộc 1–5.
- Tổng weight bằng 100, có tolerance nhỏ cho số thực.

Admin Job API chỉ đọc; không tạo mutation mà UI không có.

### 5.4. Knowledge management

| ID | Method và path | Body chính | Frontend sử dụng |
|---|---|---|---|
| KNW-01 | `GET /api/v1/admin/knowledge/overview` | Không có | `/admin/knowledge` |
| KNW-02 | `GET /api/v1/admin/knowledge/competencies/{id}` | Không có | Competency detail |
| KNW-03 | `POST /api/v1/admin/knowledge/job-families` | `{name, description}` | Thêm family |
| KNW-04 | `PUT /api/v1/admin/knowledge/job-families/{id}` | `{name, description}` | Sửa family |
| KNW-05 | `POST /api/v1/admin/knowledge/career-levels` | `{name, description, rankValue}` | Thêm level |
| KNW-06 | `PUT /api/v1/admin/knowledge/career-levels/{id}` | `{name, description, rankValue}` | Sửa level |
| KNW-07 | `POST /api/v1/admin/knowledge/competencies` | `{name, category, description}` | Thêm competency |
| KNW-08 | `PUT /api/v1/admin/knowledge/competencies/{id}` | `{name, category, description}` | Sửa competency |
| KNW-09 | `PUT /api/v1/admin/knowledge/competencies/{id}/levels` | `{levels:[...]}` | Lưu thang 5 cấp |
| KNW-10 | `PATCH /api/v1/admin/knowledge/{entity}/{id}/status` | `{status, force}` | Bật/tắt family, level hoặc competency |

`entity` của `KNW-10` chỉ nhận:

- `job-families`
- `career-levels`
- `competencies`

Overview trả ba collection, mỗi item có `status` và `usageCount`; competency có thêm `completedLevels`.

Quy tắc:

- Tên unique không phân biệt hoa/thường và khoảng trắng thừa.
- `rankValue` unique, từ 1 đến 20.
- Category tạm thời là text từ 2 đến 180 ký tự để khớp form hiện tại.
- Tạo mới mặc định `ACTIVE`.
- Không hard delete.
- Tắt item đang được Job sử dụng trả `409` nếu `force=false`.
- Khi `force=true`, dữ liệu lịch sử giữ nguyên nhưng item không còn xuất hiện trong danh sách lựa chọn cho Job mới.
- Sửa tên phải được phản ánh qua relation khi đọc Job; không lưu bản sao tên vào bảng Job.
- `KNW-09` bắt buộc đúng 5 level, mỗi level 1–5 xuất hiện đúng một lần và upsert trong một transaction.

Backend entity dùng field `label` cho Competency Level; adapter frontend có thể map `label -> title` để không phải đổi toàn bộ UI ngay.

Mỗi mutation ghi `KNOWLEDGE_CHANGED` vào activity log.

### 5.5. Application/AI monitoring

| ID | Method và path | Query/body chính | Frontend sử dụng |
|---|---|---|---|
| APP-01 | `GET /api/v1/admin/applications` | `search`, `aiStatus`, `dateRange=7|30|ALL`, `page`, `size`, `sort` | `/admin/applications` |
| APP-02 | `GET /api/v1/admin/applications/{applicationId}` | Path UUID | Application detail |
| APP-03 | `POST /api/v1/admin/applications/{applicationId}/ai-retries` | Header `Idempotency-Key`; không cần body trong MVP | Nút Retry AI |

List item chỉ trả metadata admin được phép xem:

```json
{
  "id": "uuid",
  "candidateId": "uuid",
  "candidateName": "Nguyễn Văn A",
  "jobId": "uuid",
  "jobTitle": "Backend Engineer",
  "departmentName": "Engineering",
  "aiStatus": "FAILED",
  "submittedAt": "2026-07-28T10:00:00Z",
  "aiConfidence": null,
  "needsReview": true,
  "extractionMethod": null,
  "errorCode": "AI_TIMEOUT",
  "errorMessage": "Quá thời gian xử lý.",
  "canRetry": true
}
```

Detail bổ sung candidate/job tối thiểu, `warningCount` và pipeline thật:

```json
{
  "pipeline": [
    {
      "step": "RECEIVED",
      "status": "COMPLETED",
      "message": "Tệp đã được tiếp nhận.",
      "startedAt": "2026-07-28T10:00:00Z",
      "completedAt": "2026-07-28T10:00:01Z"
    }
  ]
}
```

Các step chuẩn:

1. `RECEIVED`
2. `EXTRACTION`
3. `MATCHING`
4. `CAREER_PATH`
5. `COMPLETED`

`APP-03` trả `202 Accepted`:

```json
{
  "applicationId": "uuid",
  "runId": "uuid",
  "status": "WAITING",
  "acceptedAt": "2026-07-28T10:00:00Z"
}
```

Quy tắc retry:

- Chỉ retry khi latest AI run là `FAILED` và lỗi được phép retry.
- `INVALID_FILE` không retry được.
- Nếu đã có run `WAITING` hoặc `PROCESSING`, trả `409`.
- Cùng `Idempotency-Key` phải trả lại cùng run, không tạo task/cost lần hai.
- Không thay đổi recruitment status.
- Backend Core là source of truth và publish task qua RabbitMQ; frontend không gọi trực tiếp AI Service.
- AI Service trả event tiến trình/kết quả; Backend Core cập nhật run, step và Application trong transaction phù hợp.
- Khi hoàn tất hoặc thất bại, ghi activity. Có thể phát notification cho HR bằng luồng notification hiện có.

Frontend bỏ timer giả lập. Sau khi nhận `202`, React Query poll `APP-02` khi status là `WAITING`/`PROCESSING`, dừng khi `COMPLETED`/`FAILED` hoặc quá timeout hiển thị. Người dùng không cần giữ dialog mở.

### 5.6. Dashboard và Reports

| ID | Method và path | Query | Frontend sử dụng |
|---|---|---|---|
| DSH-01 | `GET /api/v1/admin/dashboard` | `rangeDays=7|30` | `/admin/dashboard` và `/admin/reports` |

Không tạo Reports API riêng vì `ReportsPage` hiện tái sử dụng đúng `useDashboard(range)`.

Response nghiệp vụ:

```json
{
  "rangeDays": 7,
  "generatedAt": "2026-07-28T10:00:00Z",
  "hasData": true,
  "metrics": {
    "totalUsers": 120,
    "blockedUsers": 3,
    "openJobs": 12,
    "incompleteJobs": 2,
    "applicationsInRange": 35,
    "aiCompletedInRange": 30,
    "aiFailedInRange": 2,
    "aiCompletionRate": 86
  },
  "aiStatusCounts": {
    "WAITING": 1,
    "PROCESSING": 2,
    "COMPLETED": 30,
    "FAILED": 2
  },
  "applicationTrend": [
    {"date": "2026-07-28", "count": 5}
  ],
  "recentActivities": []
}
```

Frontend adapter dựng:

- KPI labels, suffix, change text và links.
- Attention queue.
- Màu chart và status labels.
- `DashboardData` hiện tại.

## 6. Thay đổi dữ liệu dự kiến

Không sửa các migration `V1`–`V8` đã có. Tạo migration mới tuần tự.

### Phase 1

- Bổ sung vào `users`: `employee_code`, `department_name`, `job_title`, `work_location`, `last_active_at`, `block_reason` và field phục vụ thu hồi JWT nếu chọn token version.
- Tạo `activity_logs`: actor, kind, source, target type/id/label, description, metadata JSONB, created_at.
- Index cho user filters và activity target/time.

`last_active_at` trong MVP cập nhật khi đăng nhập thành công; chưa cần ghi DB ở mọi request.

### Phase 2

- Bổ sung `jobs.status`, `department_name`, `openings_count`.
- Backfill an toàn: `is_active=true -> OPEN`, `is_active=false -> CLOSED`.
- DRAFT và PAUSED chỉ xuất hiện với dữ liệu được tạo/cập nhật sau khi HR Job API hỗ trợ status đầy đủ.
- Giữ `is_active` trong giai đoạn tương thích, chưa drop ngay.
- Index cho status, family, career level, HR và thời gian.

`requirements`/`benefits` hiện là text ở backend và text-area ở HR form. Admin DTO có thể tách theo dòng thành array; chưa cần migration JSONB chỉ để phục vụ hiển thị.

### Phase 3

- Thêm `is_active` vào `job_families`, `career_levels`, `competencies`, mặc định `true`.
- Thêm unique/index cần thiết cho tên chuẩn hóa và rank.
- Không thêm soft-delete riêng vì `is_active` đã đáp ứng UI.

### Phase 4

- Bổ sung metadata AI tổng hợp hoặc liên kết latest run trên `applications`.
- Tạo `ai_processing_runs`: application, attempt, status, trigger, idempotency key, timestamps và lỗi.
- Tạo `ai_processing_steps`: run, step, status, message, timestamps.
- Unique partial constraint để một application chỉ có một run active.
- Index theo AI status, applied_at, application và run.

Không lưu raw CV hoặc full AI payload vào activity log.

## 7. Kế hoạch triển khai 5 phase

## Phase 1 — API foundation, JWT, User và Activity (đã hoàn thành 29/07/2026)

**Độ khó:** thấp đến trung bình.

**Mục tiêu:** tạo nền HTTP/security/audit dùng lại cho các phase sau và đưa trang User sang dữ liệu thật.

**Thứ tự API và tích hợp:**

1. `AUTH-01`, `AUTH-02`: tích hợp login, route guard, topbar và thay `CURRENT_ADMIN_ID`.
2. `AUTH-03`, `AUTH-04`: rotate/revoke refresh JWT và xử lý access token hết hạn.
3. `USR-01`: chuyển danh sách/filter/pagination User sang HTTP.
4. `USR-02`: chuyển trang chi tiết, xử lý nullable staff fields/last activity.
5. `ACT-01`: chuyển trang Activity và tab activity của User sang HTTP.
6. `USR-03`: khóa/mở tài khoản, invalidate list/detail/dashboard/activity.

**Backend:**

- Tạo `AdminUserController`, `AdminUserService`, DTO/projection và `ActivityRecorder`.
- Bật `@EnableMethodSecurity` và test `ROLE_ADMIN`.
- Thêm error codes cụ thể thay vì trả `UNCATEGORIZED_EXCEPTION`.
- Chuẩn hóa page result.
- Bảo đảm block tài khoản có hiệu lực dù access JWT đã được phát trước đó còn hạn.

**Frontend:**

- Tạo API client dùng chung: base URL, auth, parse `ApiResponse`, normalize error.
- Tạo `HttpAdminService`.
- Refactor `DataTable` để hỗ trợ pagination/sort controlled mà vẫn giữ chế độ client cho màn hình chưa migrate.
- Gỡ demo sidebar/reset khỏi HTTP production mode.
- Không hard-code tên/avatar/ID admin.

**Kiểm thử/exit criteria:**

- Candidate/HR gọi admin endpoint nhận `403`.
- Không đăng nhập nhận `401`.
- Search/filter/page/sort giữ trên URL và trả đúng dữ liệu.
- Không tự khóa; lý do ngắn bị từ chối; block user ghi activity.
- Logout hoặc JWT hết hạn đưa về login.
- User list, detail và activity không còn đọc mock.

## Phase 2 — Job monitoring (đã hoàn thành 29/07/2026)

**Độ khó:** trung bình, chủ yếu là query join/count/readiness.

**Mục tiêu:** hoàn thiện toàn bộ màn hình Job ở chế độ read-only đúng với UI hiện tại.

**Thứ tự API và tích hợp:**

1. `JOB-01`: thay việc dùng full Knowledge Overview chỉ để dựng filter.
2. `JOB-02`: danh sách, filters, status counts và server pagination.
3. `JOB-03`: detail, owner, nội dung, competencies, readiness và AI/application counts.

**Backend:**

- Migration status/department/openings.
- Dùng projection/EntityGraph/query tổng hợp để tránh N+1.
- Dùng cùng một readiness policy trong list và detail.
- Allow-list sort và index các filter chính.

**Frontend:**

- Thêm `useAdminJobFilterOptions`.
- `useJobs` nhận page/sort.
- Map text requirements/benefits sang array.
- Giữ thông báo “Admin chỉ theo dõi”; không thêm action sửa/duyệt Job.

**Kiểm thử/exit criteria:**

- Kết hợp search + family + level + readiness + status trả đúng.
- `statusCounts` không bị chính status tab làm sai.
- Job thiếu family/level/competency hoặc weight khác 100 được đánh dấu incomplete giống list và detail.
- Trang Job không còn phụ thuộc mock.

## Phase 3 — Knowledge management (đã hoàn thành 29/07/2026)

**Độ khó:** trung bình đến cao do validation, usage constraints và bulk update.

**Mục tiêu:** thay toàn bộ Knowledge mock bằng CRUD thật.

**Thứ tự API và tích hợp:**

1. `KNW-01`, `KNW-02`: overview và competency detail.
2. `KNW-03`, `KNW-05`, `KNW-07`: create từng loại, tích hợp ngay từng form.
3. `KNW-04`, `KNW-06`, `KNW-08`: update từng loại.
4. `KNW-09`: lưu transaction thang competency 5 cấp.
5. `KNW-10`: bật/tắt và confirm khi đang được sử dụng.

**Backend:**

- Migration `is_active`.
- DTO không trả entity JPA trực tiếp.
- Unique name/rank validation và error `409`.
- Usage count bằng aggregate query.
- Mutation và activity log cùng transaction.

**Frontend:**

- Bỏ return type `Promise<unknown>`; mỗi mutation dùng DTO cụ thể.
- Map lỗi conflict vào dialog/form.
- Invalidate đúng overview, detail, Job filter options và Job detail liên quan; không invalidate toàn bộ cache nếu không cần.
- Khi create Competency, detail ban đầu có 5 level rỗng hoặc backend tạo skeleton thống nhất.

**Kiểm thử/exit criteria:**

- Create/update trùng tên bị chặn rõ ràng.
- Rank Career Level không trùng.
- Level phải đủ 1–5 và rollback toàn bộ nếu một item sai.
- Tắt item đang dùng cần `force=true`.
- Sửa tên hiển thị đúng khi đọc Job.
- Knowledge không còn phụ thuộc mock.

## Phase 4 — Application monitoring và AI retry (đã hoàn thành 29/07/2026)

**Độ khó:** cao nhất về tích hợp liên dịch vụ.

**Mục tiêu:** cung cấp trạng thái/pipeline AI thật và retry an toàn qua Backend Core.

**Thứ tự API và tích hợp:**

1. `APP-01`: list/filter/page với các field nullable đúng thực tế.
2. `APP-02`: detail và pipeline từ latest persisted run.
3. `APP-03`: enqueue retry, polling, completion/failure states.

**Backend Core:**

- Migration AI run/step.
- API đọc chỉ trả metadata kỹ thuật phù hợp quyền Admin.
- Transaction/idempotency/concurrent-run guard cho retry.
- Publisher và result/progress consumer qua RabbitMQ.
- Ghi activity khi requested/completed/failed.

**AI Service:**

- Chốt schema/version của message retry.
- Nhận application ID, immutable Job snapshot và vị trí file; không tin dữ liệu do browser gửi.
- Phát step progress và terminal result có correlation/run ID.
- Không tự quyết định recruitment status.

**Frontend:**

- Xóa retry timers giả.
- Poll detail trong trạng thái active; có giới hạn thời gian và refetch khi quay lại tab.
- Disable retry khi `canRetry=false` hoặc run đang active.
- Hiển thị `—` cho confidence/method chưa có.
- Không thêm raw CV hay chuyên môn vào admin detail.

**Kiểm thử/exit criteria:**

- `INVALID_FILE` không có nút retry.
- Double click/cùng idempotency key chỉ tạo một run.
- Retry không đổi recruitment status.
- Tiến trình còn đúng sau reload trang.
- AI timeout/failure trả message đã sanitize, không lộ stack trace.
- Application không còn phụ thuộc mock.

## Phase 5 — Dashboard, Reports và hardening toàn hệ thống (đã hoàn thành 29/07/2026)

**Độ khó:** cao do aggregate cross-domain, hiệu năng và kiểm thử end-to-end.

**Mục tiêu:** hoàn thiện hai màn hình tổng hợp và loại bỏ toàn bộ mock khỏi production path.

**Thứ tự API và tích hợp:**

1. `DSH-01` với `rangeDays=7`.
2. Dùng cùng API cho `rangeDays=30` trên Dashboard/Reports.
3. Tối ưu query, index và cache ngắn nếu đo được nhu cầu.

**Backend:**

- Aggregate theo UTC và định nghĩa rõ cửa sổ ngày.
- Dùng query aggregate/projection, không load toàn bộ entity vào memory.
- Có recent activities giới hạn số lượng.
- Có thể cache 30–60 giây; mọi mutation vẫn invalidate logic ở frontend, backend không cần trả dữ liệu tuyệt đối real-time từng mili giây.

**Frontend:**

- Map response domain sang metrics, attention, labels, colors và href.
- Reports tiếp tục dùng chung query; không tạo request trùng.
- Gỡ `mockAdminService` khỏi production composition.
- Gỡ/ẩn DEMO badge, scenario switcher và reset demo trong HTTP mode.

**Hardening và exit criteria:**

- Chạy migration từ database V8 sạch và từ database có dữ liệu.
- Backend test suite, frontend lint/build đều pass.
- Smoke/E2E: login Admin → user block/unblock → Job filters/detail → knowledge create/edit/levels/status → Application retry → Dashboard/Activity cập nhật.
- Kiểm tra `401/403/404/409/500`, loading, empty và retry UI.
- Không có API admin nào fallback mock trong production.
- OpenAPI phản ánh đủ 21 admin endpoints và các API vòng đời JWT phụ thuộc.

**Kết quả triển khai:**

- `DSH-01` hỗ trợ đúng `rangeDays=7|30`; giá trị khác trả `400` với error code riêng.
- Cửa sổ ngày được tính theo UTC, bao gồm ngày hiện tại: từ `00:00` của ngày đầu tiên đến trước `00:00` của ngày kế tiếp sau hôm nay.
- AI status và application trend dùng aggregate projection tại database; các ngày không có hồ sơ được điền `0`, không load toàn bộ Application vào memory.
- Quy tắc Job chưa sẵn sàng được tái sử dụng qua `AdminJobService`; recent activities chỉ lấy 6 bản ghi mới nhất.
- Dashboard và Reports dùng chung `useDashboard(range)` và query key, với `staleTime=30s`; frontend map response domain sang toàn bộ model hiển thị.
- `adminService` dùng HTTP cho toàn bộ method. Badge, scenario switcher, reset và nội dung demo đã được gỡ khỏi khu vực Admin.
- Không bổ sung cache backend vì chưa có số liệu cho thấy cần thiết; các index từ V9, V10 và V13 đã bao phủ các filter thời gian/status đang dùng.
- Bổ sung UTC JDBC convention, CORS cho `Idempotency-Key`, và nâng springdoc lên dòng 3.x tương thích Spring Boot 4.
- Full backend suite: 23/23 test pass. Frontend lint: 0 error; production build pass.
- Smoke PostgreSQL có dữ liệu và database sạch đều pass; database sạch chạy đủ V1→V13. API smoke pass cho 7/30 ngày và `400/401/403`.
- `/v3/api-docs` phản ánh đủ 21 operation dưới `/api/v1/admin/**`.

## 8. Cấu trúc code đề xuất

### 8.1. Backend: bám cấu trúc hiện có

Không tạo các package lồng mới như `controller/admin`, `service/admin` hoặc `dto/admin`. Code mới phải đi vào đúng các package mà backend hiện đã sử dụng:

```text
backend-core/src/main/java/com/tttn/backend_core/
├── controller/
│   ├── AdminUserController.java
│   ├── AdminJobController.java
│   ├── AdminKnowledgeController.java
│   ├── AdminApplicationController.java
│   ├── AdminActivityController.java
│   └── AdminDashboardController.java
├── dto/
│   ├── request/
│   └── response/
├── service/
│   ├── AdminUserService.java
│   ├── AdminJobService.java
│   ├── AdminKnowledgeService.java
│   ├── AdminApplicationService.java
│   ├── AdminActivityService.java
│   └── AdminDashboardService.java
├── repository/
├── entity/
├── exception/
├── security/
└── config/
```

Tên class có prefix `Admin` để phân biệt use case quản trị nhưng không thay đổi layout package của dự án.

Nguyên tắc clean code bắt buộc khi triển khai:

- Controller mỏng: nhận request, validation và gọi service; không chứa query hoặc business rule.
- Service giữ business rule và transaction boundary.
- Repository chỉ truy vấn dữ liệu; không đưa quyết định nghiệp vụ vào JPQL/SQL nếu quyết định đó cần dùng lại ở nhiều nơi.
- Request/response dùng DTO trong hai package có sẵn; không trả JPA entity trực tiếp.
- Dùng `ApiResponse`, `AppException` và `ErrorCode` hiện có; không tự tạo một error format thứ hai.
- Mọi thay đổi schema đi qua Flyway migration mới; không sửa migration cũ và không bật Hibernate auto-update.
- Constructor injection; không field injection.
- Mapping entity/DTO phải có một nơi chịu trách nhiệm, không copy cùng đoạn mapping ở nhiều controller.
- List endpoint dùng projection, `EntityGraph` hoặc aggregate query phù hợp để tránh N+1.
- Tên method mô tả use case; tránh các `BaseService`, generic CRUD abstraction hoặc helper dùng chung quá sớm.
- Method ngắn, validation domain rõ, không dùng magic string cho status/kind/error code.
- Mutation ghi dữ liệu và activity trong cùng transaction nếu cùng database.
- Chạy Spotless/Google Java Format và test trước khi hoàn thành API.
- Test đặt dưới package tương ứng hiện có trong `backend-core/src/test/java/com/tttn/backend_core`.

### 8.2. Frontend

```text
frontend/src/
├── services/http/
│   ├── api-client.ts
│   ├── http-admin.shared.ts
│   ├── http-admin-activity.service.ts
│   ├── http-admin-user.service.ts
│   ├── http-admin-job.service.ts
│   ├── http-admin-knowledge.service.ts
│   ├── http-admin-application.service.ts
│   ├── http-admin-dashboard.service.ts
│   └── http-admin.service.ts
└── services/admin.service.ts
```

`AdminService` được giữ làm facade; HTTP implementation đã tách theo module để mapper, DTO trung gian và endpoint của từng domain có một nơi chịu trách nhiệm rõ ràng.

## 9. Chiến lược kiểm thử

### Backend

- Controller/security test bằng MockMvc cho `401/403`, validation và response envelope.
- Service unit test cho self-block, knowledge conflicts, readiness, retry eligibility và idempotency.
- Repository/integration test cho filters, counts và aggregates.
- Ưu tiên PostgreSQL Testcontainers cho query dùng JSONB/partial index; H2 không đủ tin cậy cho các phần này.
- Migration test từ V8.

### Frontend

- Unit test API mapper và error normalization.
- Hook/component test cho server pagination, status mutation và retry polling.
- Contract fixture bám theo OpenAPI.
- Mỗi API mới có ít nhất một smoke test qua màn hình thật.
- Cuối mỗi phase chạy:

```text
backend-core: mvn test
frontend: npm run lint
frontend: npm run build
```

## 10. Tự review sau phản hồi

### 10.1. Scope đã được xác nhận

Scope bám theo frontend hiện tại vì hệ thống đã chuyển sang mô hình website nội bộ. Tài liệu admin cũ chỉ dùng để tham khảo và không còn là nguồn yêu cầu.

Quyết định chính thức:

- Không có quy trình xác minh HR.
- Admin không duyệt/từ chối/ẩn/sửa Job vì frontend hiện chỉ có chức năng giám sát.
- Không phát triển API cho một action chưa có trên frontend.
- Nếu frontend thay đổi sau này, API tương ứng được lập kế hoạch bổ sung riêng.

### 10.2. Giải thích JWT và từ “session”

Backend đang dùng JWT đúng nghĩa:

- `SecurityConfig` đặt `SessionCreationPolicy.STATELESS`.
- `AuthService` phát access token và refresh token.
- `JwtFilter` đọc access token từ header `Authorization`.

Kế hoạch không đề nghị chuyển sang Spring `HttpSession`. Từ “session” trước đó chỉ mô tả trạng thái “người dùng đang đăng nhập” và dễ gây hiểu nhầm, nên đã được thay bằng “vòng đời JWT”.

Tại thời điểm khảo sát ban đầu, vòng đời JWT còn thiếu các phần sau; các phần này đã được hoàn thiện ở Phase 1:

1. Frontend login vẫn là scaffold, chưa giữ và gửi access token.
2. Backend phát refresh token nhưng chưa có API refresh.
3. Logout frontend chỉ điều hướng về `/`, chưa thu hồi refresh token.
4. `JwtFilter` chỉ kiểm tra JWT; nếu admin khóa một tài khoản, access token đã cấp vẫn có thể dùng đến khi hết hạn.

Đề xuất không đổi công nghệ:

```text
Login
→ access JWT ngắn hạn + refresh JWT
→ frontend gọi API bằng Bearer access JWT
→ access hết hạn thì dùng refresh JWT để lấy token mới
→ logout thu hồi refresh JWT
→ account bị block thì backend từ chối dù access JWT cũ còn hạn
```

Việc dùng Redis để lưu/revoke refresh token không biến JWT thành `HttpSession`. Redis chỉ giúp rotate, chống tái sử dụng và thu hồi refresh token.

### 10.3. Giải thích lựa chọn retry AI

Có hai cách triển khai nút “Chạy lại AI”:

**Cách đồng bộ**

```text
Frontend → Backend Core → gọi HTTP /process-application của AI Service
         ← chờ toàn bộ Extract → Match → Career Path chạy xong
```

Ưu điểm là code ban đầu ít hơn. Nhược điểm:

- Multi-agent có thể chạy lâu và làm HTTP timeout.
- Reload trang sẽ mất trạng thái tiến trình trên UI.
- Double click dễ tạo hai lần xử lý và hai lần chi phí AI.
- Backend Core phải giữ request mở trong suốt quá trình.
- Khó thể hiện đúng các trạng thái `WAITING`, `PROCESSING`, `FAILED`.

**Cách bất đồng bộ qua RabbitMQ**

```text
Frontend
→ POST retry tới Backend Core
→ Core tạo AI run = WAITING và trả 202 ngay
→ Core publish message RabbitMQ
→ AI Service xử lý và phát progress/result
→ Core lưu trạng thái
→ Frontend poll API detail để cập nhật giao diện
```

Codebase đã có RabbitMQ và AI consumer, nên đề xuất dùng cách bất đồng bộ. Tuy nhiên consumer hiện tại chủ yếu xử lý CV extraction; Phase 4 phải mở rộng contract cho full pipeline và thêm result/progress listener ở Backend Core.

`Backend Core là source of truth` nghĩa là:

- Browser chỉ yêu cầu retry theo `applicationId`.
- Core quyết định hồ sơ có được retry hay không.
- Core tạo `runId`, chống request trùng và lưu status.
- AI Service chỉ thực thi pipeline và báo kết quả.
- AI Service không tự thay đổi recruitment status.

Đây là phần khó nhất nên được đặt ở Phase 4.

### 10.4. Giải thích Staff Profile

Trang chi tiết user hiện hiển thị:

- Mã nhân viên.
- Đơn vị/phòng ban.
- Chức danh.
- Địa điểm làm việc.

Nhưng entity `User` backend hiện chỉ có email, họ tên, role, `isActive` và ngày tạo. Vì vậy API không thể trả bốn field trên nếu không xác định nơi lưu.

Staff Profile không liên quan đến xác minh HR. Nó chỉ là thông tin hồ sơ nội bộ để Admin xem.

Đề xuất cho MVP:

- Thêm bốn cột nullable vào `users`: `employee_code`, `department_name`, `job_title`, `work_location`.
- Không xây luồng xác minh và không cho Admin sửa các field này trên màn hình hiện tại.
- Nếu chưa có dữ liệu, frontend hiển thị “Chưa cập nhật”.
- Nếu sau này tích hợp LDAP/HRIS/danh bạ nhân sự, có thể tách sang bảng/profile riêng trong một migration khác.

Thêm trực tiếp vào `users` ở MVP phù hợp với cấu trúc codebase hiện tại và ít tạo abstraction không cần thiết.

### 10.5. Những quyết định nhỏ đã tự chốt

- Page index bắt đầu từ 0, page size mặc định 8.
- Reports dùng lại Dashboard API.
- User activity dùng chung Activity API.
- Không có hard delete cho Knowledge.
- Category Competency tạm thời là text; chưa ép enum khi UI vẫn cho nhập tự do.
- Job `is_active` được backfill sang `OPEN/CLOSED`.
- Backend không trả label/màu/href của UI.
- Admin Application chỉ nhận metadata kỹ thuật.
- Demo reset/scenario không có backend API.
- Retry dùng polling thay vì WebSocket/SSE trong MVP.

### 10.6. Các lỗi thiết kế đã phát hiện và xử lý trong kế hoạch

- Không coi `KnowledgeBaseController` quản lý Pedigree là API cho Job Family/Career Level/Competency.
- Không dùng `Application.status` hiện tại làm `aiStatus`; hai trạng thái có ý nghĩa khác nhau.
- Không giả lập retry đồng bộ trả thẳng `COMPLETED`; retry thật trả `202`.
- Không để client tự suy diễn pipeline từ một status duy nhất.
- Không trả toàn bộ danh sách rồi phân trang client khi dữ liệu thật có thể tăng.
- Không để account đã block tiếp tục dùng JWT đến hết 24 giờ.
- Không tạo Reports API và User Activity API trùng lặp.
- Không mở rộng quyền Admin sang dữ liệu CV/chuyên môn chỉ vì model mock có sẵn các field đó.

## 11. Đề nghị xác nhận

### 11.1. Đã xác nhận

1. Scope bám frontend hiện tại.
2. Không có xác minh HR.
3. Admin Job là read-only theo đúng giao diện.
4. Code backend phải bám các package `controller`, `dto/request`, `dto/response`, `service`, `repository`, `entity`, `exception`, `security`, `config` đang có.
5. Khi triển khai phải tuân thủ các quy tắc clean code tại mục 8.1.

### 11.2. Quyết định đã áp dụng khi triển khai

1. Giữ JWT stateless; access token dùng Bearer, refresh token dùng cookie HttpOnly và được rotate/revoke trong Redis.
2. Retry AI chạy bất đồng bộ qua RabbitMQ; Backend Core lưu trạng thái, frontend poll Application detail.
3. Bốn field Staff Profile được thêm nullable trực tiếp vào `users` trong MVP.

Ba quyết định này đã được áp dụng trong Phase 1 đến Phase 4. Sau khi Phase 5 hoàn thành, kế hoạch không còn điểm mơ hồ ảnh hưởng đến phạm vi API Admin hiện tại.

## 12. Rà soát hoàn thiện giao diện Admin sau 5 phase

Đợt rà soát ngày 29/07/2026 đối chiếu trực tiếp route, component, React Query hook, `AdminService`, HTTP adapter và backend service. Kết luận: 7 khu vực trên giao diện hiện tại đã có đủ API để vận hành; không cần mở thêm quyền quản trị hoặc thêm endpoint ngoài scope frontend.

| Khu vực | Chức năng hiện có | Kết quả rà soát |
|---|---|---|
| Dashboard | Aggregate 7/30 ngày, hàng đợi chú ý, AI status, xu hướng, hoạt động gần đây | Đầy đủ; lời chào dùng identity thật, refetch khi quay lại cửa sổ và link metric Job mở đúng danh sách `OPEN` |
| Tài khoản | Search/filter/sort/page, detail, staff profile, activity, khóa/mở | Đầy đủ; JWT hết hạn đưa về login, logout luôn dọn identity và toàn bộ cache quản trị |
| Tin tuyển dụng | Status tab, family/level/readiness filter, detail read-only | Đầy đủ; sửa `aiCompletedCount`/`aiFailedCount` để đếm theo `aiStatus`, filter vẫn thấy taxonomy đã tạm ngưng dùng bởi dữ liệu lịch sử |
| Xử lý hồ sơ | Search/filter/sort/page, pipeline, diagnostics, retry | Đầy đủ; retry giữ nguyên idempotency key khi request cần thử lại, polling được khởi động lại khi quay về tab |
| Kho năng lực | CRUD thông tin, bật/tắt, usage count, competency detail | Đầy đủ theo action đang có trên frontend; mutation làm mới Knowledge, Job, Dashboard và Activity liên quan |
| Nhật ký | Search, nhóm hoạt động, thời gian, phân trang, link đối tượng | Đầy đủ; hỗ trợ deep-link theo `targetType/targetId` và xem toàn bộ nhật ký từ trang chi tiết User |
| Báo cáo | Tổng hợp 7/30 ngày dùng chung Dashboard query | Đầy đủ theo scope hiện tại; không tạo request hoặc API báo cáo trùng lặp |

Các cải thiện dùng chung đã áp dụng:

- Query parameter từ URL được allow-list trước khi gửi API; page/sort/enum/UUID không hợp lệ tự quay về giá trị an toàn.
- Trang rỗng ở page lớn hơn 0 có đường quay lại page trước, tránh mắc kẹt khi dữ liệu vừa thay đổi.
- Backend từ chối filter Admin không hợp lệ bằng error code `INVALID_ADMIN_FILTER`.
- Mutation có activity hoặc ảnh hưởng số liệu tổng hợp invalidate đúng Dashboard/Activity.
- Icon chuông không còn hiển thị chấm “chưa đọc” giả vì scope hiện không có unread/notification API.
- HTTP Admin adapter được tách thành các module nhỏ theo domain.
- Khoảng 7/30 ngày của Application list dùng cùng quy ước ngày UTC bao gồm ngày hiện tại như Dashboard.

### 12.1. Phần không bổ sung vì không có trên frontend

- Không xác minh HR.
- Không cho Admin sửa, duyệt, từ chối hoặc ẩn Job.
- Không cho Admin xem raw CV, nội dung trích xuất hoặc đánh giá chuyên môn.
- Không thêm export CSV/PDF.
- Không thêm notification/unread API; icon chuông chỉ là lối tắt sang Activity.
- Không thêm API Pedigree hoặc Institutional Rule khi chưa có màn hình Admin tương ứng.

### 12.2. Kết quả kiểm tra sau rà soát

- Backend: `mvn test` pass 23/23 test.
- Frontend: `npm run lint` có 0 error; 5 warning còn lại đều thuộc khu vực Candidate và có trước đợt rà soát.
- Frontend: `npm run build` pass với Next.js 16.2.10.
- Smoke PostgreSQL: login Admin, Job detail/count, Activity date filter và filter-option đều trả response hợp lệ; filter sai trả `400` với code `1044`.
- OpenAPI sau thay đổi vẫn phản ánh đủ 21 operation dưới `/api/v1/admin/**`.
- Không thay đổi cấu trúc package backend và không thêm generic abstraction ngoài nhu cầu hiện tại.

### 12.3. Rủi ro chất lượng còn lại, không phải thiếu chức năng

Frontend chưa có test runner cho unit/component/E2E, nên các luồng giao diện hiện được bảo vệ bởi type-check trong production build, lint, backend test và smoke test API. Nếu dự án tiếp tục phát triển, ưu tiên tiếp theo nên là bổ sung Playwright cho các hành trình Admin quan trọng và contract test sinh từ OpenAPI; việc này không yêu cầu thêm chức năng hay endpoint mới.
