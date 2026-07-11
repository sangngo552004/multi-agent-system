# 📜 Bảng Quy Định Làm Việc Nhóm (Đồ án TTTN)

Đây là những quy định kỹ thuật tối giản nhưng bắt buộc để team làm việc trơn tru, không phá vỡ code của nhau. Đọc kỹ để tránh lỗi không đáng có!

## 1. Quy định về Git & Gộp Code (Merge)
*   **Tuyệt đối không code thẳng lên `main`:** `main` là nhánh thiêng liêng, luôn phải ở trạng thái "Chạy được" và "Pass CI".
*   **Tạo nhánh mới:** Khi làm task, tạo nhánh theo cú pháp: `feature/ten-tinh-nang` hoặc `bugfix/ten-loi`.
*   **Quy trình Merge:**
    *   Bắt buộc phải tạo **Pull Request (PR)**.
    *   **Không cần chờ Review.** Tuy nhiên, bạn **BẮT BUỘC phải chờ CI chạy xanh (Pass)** thì mới được phép bấm Merge.
*   **Giao tiếp & Xử lý sự cố:** Nếu có vấn đề phức tạp hoặc cần trao đổi dài, hãy tạo **Issue trên GitHub repo**, sau đó gửi link Issue qua **Zalo nhóm** để mọi người cùng xem và xử lý.

## 2. Quy định CI & SonarQube
*   Khi tạo PR, SonarQube sẽ quét code tự động.
    *   **Bắt buộc sửa:** Các cảnh báo liên quan đến **Bảo mật (Security Vulnerabilities)**. Phải fix xong mới được merge.
    *   **Được phép bỏ qua:** Các cảnh báo về **Độ bao phủ Test (Code Coverage)**. Hiện tại đồ án ưu tiên tốc độ ra tính năng, chưa ưu tiên độ bao phủ của test.

## 3. 🚨 QUAN TRỌNG: Cài đặt & Sử dụng Git Hook (Pre-commit)
Dự án đã được cấu hình sẵn Pre-commit (ví dụ qua `.pre-commit-config.yaml` hoặc `commitlint.config.js`).
*   **Tác dụng vô cùng to lớn:** Nó giúp tự động phát hiện và TỰ ĐỘNG FIX các lỗi liên quan đến format code, lint code ngay tại thời điểm bạn gõ `git commit`. Nhờ vậy, code của cả team luôn đồng nhất, và bạn không phải nếm trải cảm giác tốn thời gian chờ CI trên GitHub báo lỗi đỏ, rồi lại lóc cóc về máy sửa lại vài dấu cách.
*   **Cách cài đặt:** Lần đầu tiên pull code về, git hook sẽ chưa hoạt động ngay. Bạn **BẮT BUỘC phải cài đặt nó trước**. Mở terminal và chạy lệnh tương ứng (Ví dụ: `pre-commit install` hoặc `npm install`). Nó sẽ tự gắn hook vào `.git`. Từ đó về sau bạn cứ commit là nó tự chạy.

## 4. Cơ sở dữ liệu & Flyway Migration (BẮT BUỘC HIỂU RÕ)
Dự án quản lý DB bằng Flyway. Chế độ tự động update DB của Hibernate (`spring.jpa.hibernate.ddl-auto=update`) **ĐÃ BỊ TẮT**.
*   **Điều này có nghĩa là:** Nếu bạn chỉ thêm/sửa thuộc tính trong class `@Entity` (Ví dụ thêm `String phoneNumber`), Database sẽ KHÔNG THAY ĐỔI. Code chạy sẽ báo lỗi cột không tồn tại.
*   **Quy trình đúng:** Mỗi khi muốn đổi cấu trúc bảng, bạn phải tạo một file SQL migration mới (Ví dụ: `V2__add_phone.sql` trong thư mục `src/main/resources/db/migration`). Viết lệnh `ALTER TABLE` vào đó. Khi start app, Flyway sẽ đọc file này và nâng cấp Database an toàn.

## 5. Quy định Code Backend (Spring Boot)
*   **Xử lý Lỗi (Exception):** Tuyệt đối không dùng `return ResponseEntity.status(400)`. Bắt buộc phải quăng lỗi bằng `throw new AppException(ErrorCode.TEN_LOI)`. Lỗi mới thì định nghĩa thêm vào Enum `ErrorCode`.
*   **Unit Test (Optional):** Không ép buộc, nhưng khuyến khích viết Unit Test nếu bạn có thời gian rảnh, đặc biệt là cho các logic nghiệp vụ phức tạp.
