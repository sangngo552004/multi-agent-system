# Kiến Trúc Gửi Email Phân Tán (Transactional Outbox & Saga Pattern)

Tài liệu này mô tả chi tiết luồng nghiệp vụ và kiến trúc kỹ thuật của tính năng **Batch Email** (Gửi email hàng loạt cho ứng viên). Tính năng này được thiết kế theo mô hình Microservices, đảm bảo tính bền vững (Resilience), chống mất dữ liệu (Zero Data Loss), và không nghẽn cổ chai (High Throughput).

## 1. Thành Phần Hệ Thống (Components)
- **Backend Core Service**: Chịu trách nhiệm quản lý Application, CV, State Machine của ứng viên và điều phối luồng Saga.
- **Notification Service**: Microservice độc lập chuyên gửi Email qua SMTP.
- **RabbitMQ**: Message Broker đóng vai trò giao liên.
- **MySQL (Core & Notification)**: Hai schema độc lập.

## 2. Các Bảng Cơ Sở Dữ Liệu Quan Trọng
1. **`applications` (Core)**: Chứa trạng thái của ứng viên (PENDING, SHORTLISTED, PENDING_EMAIL_SEND, INVITED, v.v.).
2. **`batch_jobs` (Core)**: Quản lý tiến độ của đợt gửi mail hàng loạt (1 job = 3000 emails).
3. **`outbox_events` (Core)**: Đóng vai trò là chiếc cầu nối an toàn, lưu trữ các event cần gửi sang RabbitMQ (để chống sập Server).
4. **`email_jobs` (Notification)**: Đóng vai trò là lá chắn Idempotency, lưu trữ lịch sử email để chặn gửi trùng.

## 3. Luồng Hoạt Động (End-to-End Workflow)

Đường đi của 3000 emails được thực thi qua **5 Bước** an toàn:

### Bước 1: Tiếp nhận Yêu cầu (Gateway)
- HR bấm nút "Gửi thư mời" cho 3000 ứng viên từ giao diện.
- API `POST /batch-email` tại `ApplicationController` (Core) tiếp nhận.
- **Action**: Nó gói toàn bộ 3000 IDs, Subject Template, Body Template vào một cục JSON, lưu vào bảng `batch_jobs` với trạng thái `PENDING`.
- **Response**: Trả về ngay lập tức `202 ACCEPTED` cùng ID của Batch Job cho Frontend để hiển thị thanh Progress Bar. Hệ thống không bị treo.

### Bước 2: Băm nhỏ dữ liệu (Chunking Async Worker)
- File `BatchEmailAsyncProcessor.java` (chạy ngầm mỗi 10 giây) quét các Batch Job đang `PENDING`.
- Nó cắt 3000 IDs ra thành từng **Chunk 500 IDs**.
- **Chống Race Condition**: Dùng hàm UPDATE có điều kiện: `UPDATE ... SET status = PENDING_EMAIL_SEND WHERE status = SHORTLISTED`. Nếu HR bấm đúp chuột 2 lần, câu lệnh này ở lần 2 sẽ trả về `0 rows updated`, triệt tiêu hoàn toàn lỗi Double Click.
- Sinh ra 500 dòng Payload nhét vào bảng `outbox_events` (Status = `NEW`).

### Bước 3: Người gác đền (Outbox Poller)
- File `OutboxPollerJob.java` (chạy ngầm mỗi 5 giây) quét bảng `outbox_events`.
- **Tránh tranh chấp**: Dùng `SELECT ... FOR UPDATE SKIP LOCKED`. Dù triển khai 10 instance Backend Core, chúng vẫn sẽ chia nhau lấy data mà không bị kẹt (Lock Contention).
- Đóng gói dữ liệu bắn sang RabbitMQ Queue `notification.email.queue`.
- Đánh dấu trạng thái trong DB thành `PUBLISHED`.
- *Nếu RabbitMQ sập, Transaction bị Rollback, dữ liệu vẫn là `NEW` để 5 giây sau gửi lại.*

### Bước 4: Xử lý tại Notification Service
- Hàm `EmailEventConsumer` hút message từ RabbitMQ.
- **Idempotency Shield**: Cố gắng `INSERT` vào bảng `email_jobs` với Khóa Chính (Primary Key) là `outbox_event_id`. Nếu RabbitMQ nhả trùng 1 message 2 lần, lệnh INSERT thứ 2 sẽ quăng lỗi `DuplicateKey` -> Consumer bỏ qua, không gửi mail.
- **Rate Limiting**: Cấu hình `prefetch=50` giúp SMTP Server không bị quá tải.
- Gửi mail thật qua `JavaMailSender`.
- Bắn Saga Reply (`SUCCESS` / `FAILED`) ngược lại Queue `core.status.reply.queue`.

### Bước 5: Đóng vòng Saga (Native Batching)
- Trở về Backend Core, `NotificationReplyListener` lắng nghe `core.status.reply.queue`.
- Nhờ cấu hình `consumer-batch-enabled=true`, Spring tự động **gom 500 messages lại thành 1 List** trên RAM trước khi chạy hàm.
- Hệ thống dùng `updateStatusBatch` chạy đúng **1 lệnh SQL duy nhất** để update 500 ứng viên thành `INVITED` hoặc `REJECTED_FINAL`.
- **Zero Data Loss**: Toàn bộ luồng được bọc trong `@Transactional`. Nếu Server Core cúp điện lúc này, Spring chưa trả ACK cho RabbitMQ. Khi có điện lại, RabbitMQ trả về y nguyên lô 500 messages đó để chạy lại.

## Kết luận
Kiến trúc này đảm bảo:
1. **Không chậm trễ**: Nút bấm trên UI phản hồi ngay lập tức (202).
2. **Không mất data**: Server sập ở bất kỳ bước nào cũng tự động khôi phục và chạy tiếp.
3. **Không gửi trùng**: Nhờ Idempotency Key (Bảng `email_jobs`) và State Machine (`PENDING_EMAIL_SEND`).
4. **Không nghẽn mạng**: Các cục to (3000 IDs) được băm nhỏ thành 500, và gom lại Batch Update để giảm thiểu tải cho Database I/O.
