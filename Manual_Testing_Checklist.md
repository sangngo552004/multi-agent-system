# Danh sách Kịch bản Kiểm thử (Manual Testing Checklist)

Đây là tài liệu chi tiết dùng để test trọn vẹn luồng hệ thống TTTN sau khi đã cài cắm "Kho tri thức" AI (Competencies, Rules) và liên thông RabbitMQ. Dữ liệu đã được nạp sẵn, bạn chỉ việc làm theo.

*(Lưu ý: Mật khẩu mặc định của tất cả tài khoản mẫu đều là `password123`)*

---

## Giai đoạn 1: Khởi động & Môi trường

| 📌 | Kịch bản / Bước thực hiện | Kết quả mong đợi (Expected) | Trạng thái (Pass/Fail) |
|---|---------------------------|-----------------------------|------------------------|
| 1 | Mở terminal gốc (`d:\TTTN`), chạy `docker-compose up -d --build`. | Lên 6 containers: `redis`, `rabbitmq`, `ai-service`, `notification-service`, `backend-core`, `frontend`. Không container nào báo lỗi (Exited). | [ ] |
| 2 | Chờ khoảng 30s cho Backend chạy Flyway, mở `localhost:3000`. | Truy cập được trang chủ Frontend. | [ ] |

---

## Giai đoạn 2: Luồng Ứng viên (Candidate Flow)

**Tài khoản test:** `candidate1@tttn.com` hoặc dùng email thật của bạn (đăng ký mới).

| 📌 | Kịch bản / Bước thực hiện | Kết quả mong đợi (Expected) | Trạng thái (Pass/Fail) |
|---|---------------------------|-----------------------------|------------------------|
| 1 | Click Đăng nhập -> Điền `candidate1@tttn.com` / `password123`. | Đăng nhập thành công, chuyển hướng vào màn hình của ứng viên. | [ ] |
| 2 | Truy cập danh sách Job, tìm job **"Senior Java Developer"** và bấm Xem chi tiết. | Thấy các yêu cầu kỹ năng (Java, System Design), luật ưu tiên (Top Uni, Big Tech) do DB (V18) tự sinh ra. | [ ] |
| 3 | Nhấn **Apply (Ứng tuyển)** và tải lên 1 file CV (PDF) thực tế của bạn. | Giao diện báo nộp thành công. Backend bắn event sang `ai-service` để quét. Tốc độ rất nhanh, không bị đơ. | [ ] |
| 4 | Vào mục **Hồ sơ của tôi / My Applications**. | Thấy hồ sơ đang ở trạng thái `Đang phân tích (WAITING)`. Chờ 1-2 phút, refresh lại sẽ thấy `COMPLETED` kèm Điểm số Fit Score AI đánh giá. | [ ] |

---

## Giai đoạn 3: Luồng Nhân sự (HR Flow)

**Tài khoản test:** `hr.tech@tttn.com` / `password123`.

| 📌 | Kịch bản / Bước thực hiện | Kết quả mong đợi (Expected) | Trạng thái (Pass/Fail) |
|---|---------------------------|-----------------------------|------------------------|
| 1 | Mở trình duyệt ẩn danh (Incognito), đăng nhập bằng tài khoản HR. | Chuyển hướng vào Dashboard dành riêng cho HR. | [ ] |
| 2 | Vào mục Quản lý Tin Tuyển Dụng (My Jobs), mở job **"Senior Java Developer"**. | Thấy được file CV mà Candidate 1 vừa nộp ban nãy. | [ ] |
| 3 | Bấm vào chi tiết ứng viên đó để xem **Báo cáo AI (AI Scoring Breakdown)**. | Thấy rõ AI chấm điểm Java bao nhiêu (Level 1-5), có cộng điểm Đại học hay Big Tech không, tổng ra bao nhiêu % match. | [ ] |
| 4 | Bấm nút **Phê duyệt (Accept / Invite to Interview)**. | Hành động lưu vào DB. Hệ thống bắn event xuống RabbitMQ. `notification-service` nhận được và gửi 1 email báo đậu phỏng vấn đến ứng viên. | [ ] |

---

## Giai đoạn 4: Luồng Quản trị viên (Admin Flow)

**Tài khoản test:** `admin@tttn.com` / `password123`.

| 📌 | Kịch bản / Bước thực hiện | Kết quả mong đợi (Expected) | Trạng thái (Pass/Fail) |
|---|---------------------------|-----------------------------|------------------------|
| 1 | Đăng nhập bằng tài khoản Admin. | Truy cập vào màn Admin Dashboard. | [ ] |
| 2 | Vào mục **Quản trị Người dùng (User Management)**. | Thấy danh sách HR và Candidate (hr.tech, hr.sales, candidate1, v.v.). Có nút Block/Unblock. | [ ] |
| 3 | Vào mục **Quản lý Tri Thức (Knowledge Management)**. | Thấy danh sách Khung Năng Lực (Competency) và Luật Chấm Điểm (Institutional Rules) có sẵn từ V18. | [ ] |

---

**🔥 Note dành riêng cho Tester (Bạn):**
> Nhờ hệ thống Database dùng chung Supabase nhưng tách biệt schema (hoặc chung table) mà `notification-service` có thể đọc trực tiếp config mà không cần đẻ thêm container DB tốn RAM. Hãy tận hưởng việc quét CV tự động bằng AI Agent nhé!
