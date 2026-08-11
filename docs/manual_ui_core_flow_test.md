# Kiểm thử thủ công các luồng chính trên giao diện

Ngày chuẩn bị dữ liệu: 11/08/2026.

## 1. Tài khoản kiểm thử

| Vai trò | Trang đăng nhập | Tài khoản | Mật khẩu |
|---|---|---|---|
| HR | `http://localhost:3000/vi/hr/login` | `hr.tech@tttn.com` | `password123` |
| Candidate | `http://localhost:3000/vi/login` | `candidate1@tttn.com` | `password123` |
| Admin | `http://localhost:3000/vi/admin/login` | `admin@tttn.com` | `password123` |

Ba tài khoản trên đã được kiểm tra trực tiếp qua API và đều đăng nhập thành công.

Nên dùng ba cửa sổ trình duyệt riêng hoặc ba profile trình duyệt để không ghi đè phiên đăng nhập.

## 2. Dữ liệu tạo tin tuyển dụng

### Thông tin nhu cầu

- Tên vị trí: `Backend Java Developer - Manual Test 20260811`
- Địa điểm làm việc: `TP. Hồ Chí Minh`
- Loại hình: `Toàn thời gian`
- Số lượng tuyển: `1`
- Hạn nhận hồ sơ: `31/12/2026`

### Mô tả công việc

```text
Tham gia phát triển nền tảng tuyển dụng và xử lý hồ sơ ứng viên. Xây dựng REST API bằng Java và Spring Boot, thiết kế dữ liệu PostgreSQL, tích hợp Redis và RabbitMQ. Phối hợp cùng frontend và AI team để bảo đảm luồng ứng tuyển, phân tích CV và đối sánh ứng viên hoạt động ổn định.
```

### Yêu cầu ứng viên

Nhập mỗi nội dung thành một dòng riêng:

```text
Có ít nhất 2 năm kinh nghiệm phát triển backend.
Thành thạo Java 17 trở lên và Spring Boot.
Có kinh nghiệm xây dựng REST API và làm việc với PostgreSQL.
Hiểu Redis, RabbitMQ và các nguyên tắc thiết kế hệ thống.
Có khả năng giao tiếp và phối hợp nhóm tốt.
Đọc hiểu tài liệu kỹ thuật bằng tiếng Anh.
```

### Quyền lợi

```text
Mức lương cạnh tranh theo năng lực.
Thưởng tháng 13 và đánh giá tăng lương định kỳ.
Làm việc hybrid và được cấp thiết bị làm việc.
Được tham gia các khóa đào tạo kỹ thuật và ngoại ngữ.
```

### Cấu hình đối sánh

- Nhóm nghề: `ENGINEERING`
- Cấp bậc: `MID`
- `Java/Spring Boot`: mức 4, trọng số 50%, bắt buộc
- `System Design`: mức 3, trọng số 30%, bắt buộc
- `Communication`: mức 3, trọng số 20%, không bắt buộc
- Tổng trọng số phải đúng `100%`.
- Luật thưởng có thể chọn: `TOP_UNI`, `BIG_TECH`, `ENG_FLUENT`.

## 3. Luồng HR tạo và mở tin

1. Mở trang đăng nhập HR và đăng nhập bằng tài khoản ở mục 1.
2. Vào **Quản lý tin tuyển dụng** → **Tạo tin tuyển dụng**.
3. Điền dữ liệu ở mục 2.
4. Để kiểm tra Gemini, sau khi điền mô tả/yêu cầu/quyền lợi, bấm **Tạo tự động bằng AI**.
5. Kết quả đúng: AI trả danh sách năng lực/rule gợi ý. Chọn các đề xuất cần dùng và bấm áp dụng.
6. Kiểm tra lại trọng số năng lực bằng đúng 100%.
7. Bấm **Xem trước** và đối chiếu nội dung.
8. Bấm **Lưu bản nháp**.
9. Kết quả đúng: chuyển tới trang chi tiết job, trạng thái **Bản nháp** và phần đối sánh hiển thị **Sẵn sàng cho AI**.
10. Bấm **Mở tuyển**.
11. Kết quả đúng: trạng thái thành **Đang tuyển** và tin xuất hiện tại `http://localhost:3000/vi/jobs`.

## 4. Luồng Candidate nộp CV

1. Mở một cửa sổ/profile trình duyệt khác.
2. Đăng nhập Candidate bằng tài khoản ở mục 1.
3. Vào **Việc làm**, tìm `Backend Java Developer - Manual Test 20260811`.
4. Mở chi tiết tin và bấm **Ứng tuyển ngay**.
5. Tải CV của bạn lên. File nên là PDF, tối đa 10 MB và không quá 10 trang.
6. Kết quả đúng: xuất hiện thông báo ứng tuyển thành công và chuyển tới **Hồ sơ của tôi → Đơn ứng tuyển**.
7. Không nộp lại cùng tài khoản vào cùng job; backend phải chặn hồ sơ trùng.

## 5. Kiểm tra AI phân tích CV

1. Quay lại phiên HR, vào **Hồ sơ ứng viên**.
2. Lọc theo job vừa tạo và mở hồ sơ của `candidate1@tttn.com`.
3. Trạng thái AI dự kiến chuyển: **Đang chờ → Đang xử lý → Hoàn thành**.
4. Chờ khoảng 30–120 giây. Nếu danh sách chưa đổi, refresh trang.
5. Khi hoàn thành, kiểm tra:
   - Có điểm đối sánh trên thang 100.
   - Có độ tin cậy.
   - Có thông tin/kỹ năng trích xuất từ CV.
   - Có bằng chứng đối sánh theo Java/Spring Boot, System Design và Communication.
   - Không xuất hiện lỗi xử lý AI.

Trang đơn ứng tuyển của Candidate hiện không tự polling trạng thái AI, vì vậy cần refresh thủ công. Trang HR/Admin thể hiện trạng thái AI rõ hơn.

## 6. Luồng HR ra quyết định

1. Trong chi tiết hồ sơ, đọc CV và kết quả AI.
2. Bấm **Duyệt hồ sơ** → **Xác nhận**.
3. Kết quả đúng: trạng thái tuyển dụng chuyển từ **Mới nhận** sang **Danh sách ngắn**.
4. Không chọn **Không phù hợp** trên cùng hồ sơ nếu muốn tiếp tục dùng nó để demo luồng thành công.

## 7. Luồng Admin giám sát

1. Mở phiên trình duyệt thứ ba và đăng nhập Admin.
2. Vào **Hồ sơ & AI/Xử lý hồ sơ**.
3. Tìm hồ sơ của Candidate vừa nộp.
4. Mở chi tiết và kiểm tra quy trình AI, trạng thái từng bước, thời gian xử lý và lỗi nếu có.

## 8. Dấu hiệu lỗi cần ghi lại

- Job không xuất hiện công khai: kiểm tra đã bấm **Mở tuyển** và hạn nhận hồ sơ chưa hết.
- AI parser tạo JD lỗi: kiểm tra terminal AI và `GOOGLE_API_KEY`.
- Hồ sơ ở **Đang chờ** quá 2 phút: kiểm tra AI consumer/RabbitMQ và terminal AI.
- AI chuyển **Thất bại**: mở chi tiết bằng Admin để lấy error code và thông báo lỗi.
- Candidate không thấy kết quả mới: refresh trang vì màn Candidate chưa polling tự động.
