# Tài liệu Tích hợp API HR Job (Dành cho Frontend)

Tài liệu này mô tả chi tiết các API mới phục vụ luồng tạo/chỉnh sửa Job nâng cao (Ghi đè Kỹ năng, Luật, Quản lý Vòng đời) và tính năng AI Parsing. Frontend Team có thể dựa vào đây để tích hợp giao diện.

---

## 1. Danh sách API endpoints

### 1.1. AI-Powered Job Parsing
> Dùng để đọc nội dung text của JD và tự động fill vào Form Tạo Job (Bao gồm cả thông tin cơ bản và list UUID kỹ năng chuẩn).

- **Method**: `POST`
- **Path**: `/api/v1/hr/jobs/parse`
- **Request Body**:
```json
{
  "text": "Nội dung JD thô do HR copy paste vào đây..."
}
```
- **Response (200 OK)**:
```json
{
  "jobInfo": {
    "title": "Tên công việc",
    "location": "Địa điểm",
    "employmentType": "FULL_TIME",
    "description": "Mô tả công việc...",
    "requirements": "Yêu cầu...",
    "benefits": "Quyền lợi...",
    "jobFamilyId": "uuid-cua-job-family (có thể null)",
    "careerLevelId": "uuid-cua-career-level (có thể null)"
  },
  "competencies": [
    {
      "competencyId": "uuid-cua-competency-1",
      "weight": 10.0,
      "requiredLevel": 3,
      "isMandatory": true
    },
    {
      "competencyId": "uuid-cua-competency-2",
      "weight": 10.0,
      "requiredLevel": 3,
      "isMandatory": true
    }
  ]
}
```

### 1.2. Cập nhật Kỹ năng (Bulk Update Competencies)
> API Ghi đè. Thay vì FE phải gọi từng API Thêm/Sửa/Xóa kỹ năng, FE chỉ cần gom toàn bộ kỹ năng hiện có trên giao diện thành 1 mảng và đẩy lên đây. Backend sẽ tự dọn dẹp data cũ.

- **Method**: `PUT`
- **Path**: `/api/v1/hr/jobs/{id}/competencies`
- **Request Body**:
```json
[
  {
    "competencyId": "uuid-cua-competency",
    "weight": 50.0,
    "requiredLevel": 3,
    "isMandatory": true
  }
]
```

### 1.3. Cập nhật Luật thưởng điểm (Bulk Update Rules)
> Tương tự Kỹ năng, FE chỉ cần gom danh sách ID của các luật đang chọn trên giao diện và đẩy lên đây.

- **Method**: `PUT`
- **Path**: `/api/v1/hr/jobs/{id}/rules`
- **Request Body**:
```json
{
  "ruleIds": [
    "uuid-cua-rule-1",
    "uuid-cua-rule-2"
  ]
}
```

### 1.4. Quản lý Vòng đời (State Machine) & Nhân bản

| Hành động | Method | Path | Giải thích |
| :--- | :--- | :--- | :--- |
| **Nhân bản Job** | `POST` | `/api/v1/hr/jobs/{id}/duplicate` | Copy toàn bộ thông tin (Info, Skills, Rules) của một Job thành Job mới (trạng thái DRAFT). Phù hợp khi muốn mở tuyển dụng lại nhưng không muốn xoá ứng viên cũ. |
| **Publish Job** | `POST` | `/api/v1/hr/jobs/{id}/publish` | Chuyển trạng thái từ DRAFT sang PUBLISHED. (Sau này sẽ trigger email auto). |
| **Đóng Job** | `POST` | `/api/v1/hr/jobs/{id}/close` | Chuyển trạng thái từ PUBLISHED sang CLOSED. |

### 1.5. Quản lý Master Data (Dữ liệu gốc)

Hệ thống hỗ trợ đẩy đủ 4 phương thức `GET` (List & Lọc qua QueryDSL), `POST` (Tạo mới), `PUT /{id}` (Cập nhật), và `DELETE /{id}` (Xóa mềm - Soft Delete) cho các nhóm danh mục sau:

| Danh mục | Base Path | Payload POST/PUT | Giải thích |
| :--- | :--- | :--- | :--- |
| **Kỹ năng (Competency)** | `/api/v1/hr/competencies` | `MasterDataRequest` (name, description, category) | Danh sách kỹ năng yêu cầu. |
| **Nhóm việc (Job Family)** | `/api/v1/hr/job-families` | `MasterDataRequest` (name, description) | Lĩnh vực công việc (ví dụ: Engineering). |
| **Cấp độ (Career Level)** | `/api/v1/hr/career-levels` | `MasterDataRequest` (name, description, rankValue) | Cấp bậc ứng viên (ví dụ: Junior, Senior). |
| **Luật (Institutional Rule)** | `/api/v1/hr/rules` | `InstitutionalRuleRequest` (ruleCode, name, bonusPoints...) | Luật cộng điểm ưu tiên. |

> **Lưu ý quan trọng**: Thao tác `DELETE` sẽ chỉ chuyển `isActive = false` và đổi tên phần tử để tránh lỗi trùng lặp khi HR tạo mới lại sau này. Dữ liệu của các Job cũ (đã PUBLISHED) không bị ảnh hưởng do Backend đã sử dụng cơ chế Snapshot (chụp lưu) JSON tại thời điểm xuất bản.

---

## 2. Bảng mã Lỗi Nghiệp vụ (dành cho i18n)

> [!TIP]
> Frontend **không nên** hardcode text thông báo lỗi (vd: `"Job not found"`). Hãy dùng trường `error_code` do Backend trả về để map với file JSON đa ngôn ngữ (i18n) ở FE.

Tất cả API lỗi sẽ trả về HTTP Status tương ứng (400, 404) kèm Body chuẩn của TTTN:
```json
{
  "status": "error",
  "error_code": "COMPETENCY_ID_REQUIRED",
  "message": "Competency ID is required"
}
```

Dưới đây là danh sách Error Code Backend có thể trả về trong luồng quản lý Job:

| Error Code (`error_code`) | Ý nghĩa (Nguyên nhân) | Xử lý đề xuất ở FE |
| :--- | :--- | :--- |
| **`JOB_NOT_FOUND`** | Không tìm thấy Job theo ID cung cấp. | Hiển thị Toast đỏ: "Không tìm thấy chiến dịch tuyển dụng." |
| **`TITLE_REQUIRED`** / **`LOCATION_REQUIRED`** / v.v. | Các trường bắt buộc bị bỏ trống. | Highlight ô input tương ứng bằng viền đỏ. |
| **`COMPETENCY_NOT_FOUND`** | UUID kỹ năng gửi lên không tồn tại trong DB. | Toast lỗi: "Kỹ năng bạn chọn không hợp lệ hoặc đã bị xoá." |
| **`COMPETENCY_ID_REQUIRED`** / **`WEIGHT_REQUIRED`** / **`LEVEL_REQUIRED`** | Thiếu thông tin trong payload Bulk Update Kỹ năng. | Ngăn không cho User bấm Submit nếu thiếu field. |
| **`RULE_IDS_REQUIRED`** | Payload Bulk Update Rules bị null mảng ruleIds. | Kiểm tra biến trạng thái mảng ở FE trước khi gửi. |
| **`JOB_NOT_DRAFT`** | Cố gắng gọi API Update Kỹ năng / Update Rules / Publish khi Job không ở trạng thái DRAFT. | Ẩn/Disable nút "Cập nhật" trên UI nếu trạng thái khác DRAFT. |
| **`CANNOT_DELETE_PUBLISHED_JOB`** | Gọi API Xóa khi Job đang PUBLISHED hoặc CLOSED. | Ẩn nút Xoá hoặc Toast lỗi: "Không thể xoá chiến dịch đã xuất bản." |
| **`CANNOT_UPDATE_PUBLISHED_JOB_WITH_APPLICANTS`** | Cố gắng chỉnh sửa thông tin Job (PUT /jobs/{id}) khi nó đang PUBLISHED và đã có người apply. | Hiển thị Modal: "Chiến dịch đã có ứng viên, vui lòng dùng tính năng Nhân Bản để sửa đổi tiêu chí cho đợt tuyển mới." |

---

## 3. Luồng gọi API khuyên dùng (Workflow)

1. HR ấn nút "Thêm mới Job".
2. HR dán text vào form -> Gọi **AI Parsing** -> Lấy Response điền tự động vào các Form State ở Frontend.
3. HR chỉnh sửa thêm nếu muốn -> Bấm "Lưu nháp" -> Gọi `POST /api/v1/hr/jobs` (Tạo Job Info cơ bản -> Có được `jobId`).
4. Ngay sau khi có `jobId`, FE tự động gọi ngầm `PUT /api/v1/hr/jobs/{jobId}/competencies` và `PUT /api/v1/hr/jobs/{jobId}/rules` để lưu Kỹ năng và Luật.
5. Khi HR bấm "Xuất bản" -> Gọi `POST /api/v1/hr/jobs/{jobId}/publish`.

---

## 4. Quản lý Ứng viên (Applications) & Gửi Mail

Dưới đây là các API dành cho màn hình Quản lý Danh sách Ứng viên (trong một Job cụ thể) và theo dõi tiến độ gửi bulk email.

### 4.1. Lấy danh sách Ứng viên của một Job (Có Lọc & Phân trang)
> Lấy danh sách ứng viên đã nộp đơn vào một Job. Hỗ trợ truyền Params trên URL để lọc theo trạng thái, điểm phù hợp, hoặc tìm kiếm.

- **Method**: `GET`
- **Path**: `/api/v1/hr/jobs/{jobId}/applications`
- **Query Params** (Tất cả đều không bắt buộc):
  - `page`: Trang hiện tại (Mặc định 0)
  - `size`: Số lượng record mỗi trang (Mặc định 20)
  - `status`: Lọc theo trạng thái (`PENDING`, `SHORTLISTED`, `REJECTED`)
  - `fitScore`: Mức điểm fit score chính xác (Nếu cần lọc min/max thì FE tuỳ biến truyền param, hiện Backend đang hỗ trợ lọc `=` thông qua QueryDSL mặc định, nếu cần phức tạp hơn hãy báo Backend cập nhật).
- **Response (200 OK - Trả về Page<ApplicationResponse>)**:
```json
{
  "content": [
    {
      "id": "uuid-cua-application",
      "candidateId": "uuid-cua-candidate",
      "candidateName": "Nguyễn Văn A",
      "candidateEmail": "nguyenvana@gmail.com",
      "resumeUrl": "https://link-cv.com/abc.pdf",
      "status": "PENDING",
      "fitScore": 85.5,
      "appliedAt": "2024-03-15T10:30:00Z"
    }
  ],
  "pageable": { ... },
  "totalElements": 1,
  "totalPages": 1
}
```

### 4.2. Xem chi tiết Hồ sơ (AI Feedback & Scoring Breakdown)
> Dùng khi HR click vào xem chi tiết một ứng viên. Sẽ trả về thêm đánh giá của AI và breakdown điểm chi tiết.

- **Method**: `GET`
- **Path**: `/api/v1/applications/{applicationId}`
- **Response (200 OK)**:
```json
{
  "id": "uuid-cua-application",
  "candidateName": "Nguyễn Văn A",
  "status": "PENDING",
  "fitScore": 85.5,
  "aiFeedback": "Ứng viên có kỹ năng Java rất tốt nhưng thiếu kinh nghiệm làm việc thực tế...",
  "scoringBreakdown": {
    "competency_scores": [...],
    "rules_triggered": [...]
  }
}
```

### 4.3. Phê duyệt (Approve) & Từ chối (Reject)
> Đánh dấu ứng viên vào danh sách Shortlist hoặc loại.

- **Approve**: `POST /api/v1/applications/{applicationId}/approve`
- **Reject**: `POST /api/v1/applications/{applicationId}/reject`
- **Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Application approved successfully."
}
```

### 4.4. Theo dõi Tiến độ Gửi Mail Hàng loạt (Batch Email Tracking)
> Khi gửi thư mời/từ chối hàng loạt, API kích hoạt sẽ trả về một `batchJobId`. Frontend dùng ID này để gọi API dưới đây liên tục (Polling mỗi 3-5 giây) để vẽ Progress Bar.

- **Kích hoạt gửi Mail (Đã có từ trước)**: `POST /api/v1/applications/batch-email`
  - Payload cần truyền `applicationIds` (mảng ID), `action` (INVITE/REJECT), `subjectTemplate`, `bodyTemplate`.
  - Trả về Tracking ID (ví dụ: `Batch email request accepted. Tracking ID: 1234-5678...`)
- **Tracking API**: `GET /api/v1/applications/batch-email/{batchJobId}`
- **Response (200 OK)**:
```json
{
  "id": "1234-5678...",
  "status": "PROCESSING",
  "totalCount": 100,
  "processedCount": 45,
  "successCount": 40,
  "failedCount": 5
}
```
*(Khi `processedCount` == `totalCount`, tiến trình gửi mail đã hoàn tất).*
