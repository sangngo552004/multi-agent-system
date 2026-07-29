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
