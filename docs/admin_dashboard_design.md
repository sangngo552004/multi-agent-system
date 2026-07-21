# Phân tích và thiết kế Admin Dashboard — phiên bản MVP

> **Dự án:** Nền tảng tuyển dụng và định hướng nghề nghiệp sử dụng Multi-Agent AI  
> **Mục tiêu:** Xây dựng frontend demo cho Admin trước khi có backend API  
> **Định hướng:** Vừa sức với đồ án sinh viên năm cuối, dễ hiểu, có điểm nhấn nhưng không mang quy mô hệ thống doanh nghiệp

---

## 1. Kết luận đề xuất

Admin Dashboard nên tập trung vào năm chức năng chính:

1. **Dashboard tổng quan:** cho admin biết tình trạng người dùng, việc làm, hồ sơ ứng tuyển và xử lý AI.
2. **Quản lý người dùng:** xem tài khoản, khóa/mở và xác minh tài khoản HR.
3. **Quản lý việc làm:** xem toàn bộ tin tuyển dụng, duyệt hoặc ẩn tin không phù hợp.
4. **Theo dõi hồ sơ và AI:** xem kết quả bóc tách CV, điểm phù hợp, lỗi xử lý và chạy lại khi cần.
5. **Quản lý dữ liệu năng lực:** quản lý nhóm nghề, cấp bậc và danh sách kỹ năng mà hệ thống AI sử dụng.

Có thể bổ sung **báo cáo và lịch sử hoạt động** nếu còn thời gian.

Điểm nhấn của admin không nằm ở số lượng màn hình, mà ở hai chức năng:

- Admin có thể theo dõi quy trình AI xử lý một hồ sơ và xử lý trường hợp bị lỗi.
- Admin có thể quản lý dữ liệu kỹ năng/cấp độ dùng làm đầu vào cho hệ thống matching và Career Path.

Đây là phạm vi đủ khác biệt so với một trang CRUD thông thường, nhưng vẫn có thể hoàn thành bằng frontend mock trong thời gian làm đồ án.

### Phạm vi ưu tiên

| Mức | Chức năng | Ghi chú |
|---|---|---|
| P0 | Dashboard | Bắt buộc |
| P0 | Quản lý người dùng | Bắt buộc |
| P0 | Quản lý việc làm | Bắt buộc |
| P0 | Hồ sơ ứng tuyển & AI | Điểm nhấn chính |
| P0 | Dữ liệu năng lực | Điểm nhấn thứ hai |
| P1 | Báo cáo & lịch sử hoạt động | Làm nếu còn thời gian |

---

## 2. Hiểu dự án hiện tại

### 2.1. Các đối tượng trong hệ thống

- **Candidate:** tìm việc, nộp CV, xem kết quả đánh giá và lộ trình nghề nghiệp.
- **HR:** đăng tin tuyển dụng, xem ứng viên và đưa ra quyết định tuyển dụng.
- **Admin:** quản lý hoạt động chung của nền tảng và dữ liệu mà AI sử dụng.

### 2.2. Những gì codebase đã có

Backend hiện đã có nền tảng cho:

- User với role `CANDIDATE`, `HR`, `ADMIN`.
- Job và người tạo Job là HR.
- Application liên kết Candidate với Job.
- Trạng thái ứng tuyển, điểm phù hợp và phản hồi AI.
- Job Family, Career Level, Competency và Competency Level.
- AI Service thực hiện bóc tách CV, matching và tạo Career Path.

Các nguồn tham khảo chính:

- [Tài liệu BA và kiến trúc](plan/System_Architecture_and_BA.md)
- [Phân tích Career Recommendation](career_rec.md)
- [Backend entities](../backend-core/src/main/java/com/tttn/backend_core/entity/)
- [AI schemas](../ai-service/app/core/schemas.py)

Frontend hiện gần như chưa có chức năng, vì vậy có thể chủ động thiết kế admin theo nhu cầu demo.

### 2.3. Những phần còn thiếu cho Admin

- Chưa có trang admin.
- Chưa có API quản lý toàn bộ user/job/application.
- Job mới chỉ có `is_active`, chưa có trạng thái duyệt rõ.
- Application chưa tách trạng thái tuyển dụng và trạng thái xử lý AI.
- Chưa có API tổng hợp số liệu dashboard.

Các phần này có thể được mô phỏng bằng dữ liệu frontend trước. Khi làm backend, chỉ cần bổ sung những trường và API tối thiểu được nêu trong tài liệu này.

---

## 3. Vai trò và giới hạn của Admin

### 3.1. Admin được làm gì?

- Xem tổng quan hoạt động của hệ thống.
- Xem và quản lý tài khoản Candidate/HR.
- Xác minh tài khoản HR.
- Duyệt hoặc ẩn tin tuyển dụng.
- Theo dõi hồ sơ ứng tuyển và trạng thái AI.
- Chạy lại quá trình AI khi gặp lỗi phù hợp.
- Quản lý danh mục nhóm nghề, cấp bậc và kỹ năng.
- Xem một số báo cáo cơ bản.

### 3.2. Admin không nên làm gì?

- Không thay HR quyết định ứng viên được tuyển hay bị loại.
- Không sửa trực tiếp điểm phù hợp của ứng viên.
- Không xóa cứng dữ liệu đã được sử dụng.
- Không cần quản lý API key, server, RabbitMQ hay cấu hình kỹ thuật phức tạp trên giao diện.
- Không cần hệ thống phân quyền nhiều tầng trong MVP; chỉ cần role `ADMIN`.

Ranh giới đơn giản:

> HR quản lý tuyển dụng của mình; Admin quản lý nền tảng và xử lý các vấn đề chung.

---

## 4. Cấu trúc giao diện chung

### 4.1. Menu bên trái

```text
Tổng quan
Người dùng
Việc làm
Hồ sơ & AI
Dữ liệu năng lực
Báo cáo          (P1)
Lịch sử hoạt động (P1)
```

### 4.2. Thanh trên cùng

- Tên trang hiện tại.
- Ô tìm kiếm nhanh.
- Biểu tượng thông báo.
- Avatar và menu đăng xuất.
- Nhãn `DEMO` để phân biệt với dữ liệu thật.

### 4.3. Thành phần dùng lại

- Thẻ thống kê.
- Bảng dữ liệu có tìm kiếm, lọc và phân trang.
- Badge trạng thái.
- Hộp thoại xác nhận.
- Form tạo/chỉnh sửa.
- Toast thông báo thành công hoặc thất bại.
- Empty state, loading state và error state.

Nên dùng lại các thành phần này giữa các trang để giảm thời gian code và giữ giao diện nhất quán.

---

## 5. Thiết kế chức năng chi tiết

## 5.1. Dashboard tổng quan

### Mục đích

Giúp admin biết nhanh hệ thống đang có bao nhiêu người dùng, việc làm, hồ sơ và có vấn đề nào cần chú ý.

### Giá trị cho Admin

- Không cần mở từng trang để kiểm tra.
- Phát hiện nhanh hồ sơ AI bị lỗi hoặc job đang chờ duyệt.
- Có góc nhìn tổng quan để trình bày trong buổi demo.

### Thành phần giao diện

#### A. Các thẻ số liệu

- Tổng người dùng.
- Số HR đang chờ xác minh.
- Số việc làm đang hoạt động.
- Số hồ sơ ứng tuyển trong 7 ngày.
- Số hồ sơ AI xử lý lỗi.

Mỗi thẻ có thể click để mở danh sách tương ứng.

#### B. Khu vực “Cần xử lý”

Hiển thị tối đa 5–8 công việc quan trọng:

- HR đang chờ xác minh.
- Job đang chờ duyệt.
- Hồ sơ AI bị lỗi.
- Hồ sơ có độ tin cậy thấp cần kiểm tra.

Mỗi dòng gồm loại vấn đề, đối tượng, thời gian và nút “Xem chi tiết”.

#### C. Biểu đồ cơ bản

Chỉ cần hai biểu đồ:

1. Số hồ sơ ứng tuyển theo ngày trong 7 hoặc 30 ngày.
2. Tỷ lệ hồ sơ AI: hoàn thành, đang xử lý, thất bại.

Không cần biểu đồ quá phức tạp hoặc dashboard tùy chỉnh kéo-thả.

#### D. Hoạt động gần đây

Ví dụ:

- Admin đã duyệt Job “Backend Intern”.
- Admin đã xác minh HR Nguyễn Văn A.
- AI đã xử lý lại Application `APP-102`.

### Tương tác chính

- Chọn khoảng thời gian 7 ngày/30 ngày.
- Click thẻ hoặc cảnh báo để chuyển tới trang đã lọc.
- Refresh dữ liệu.

### Tiêu chí hoàn thành

- Có ít nhất 4 thẻ số liệu.
- Có danh sách vấn đề cần xử lý.
- Có ít nhất một biểu đồ.
- Click từ dashboard tới đúng danh sách liên quan.

---

## 5.2. Quản lý người dùng

### Mục đích

Quản lý tài khoản Candidate, HR và Admin ở mức cơ bản.

### Giá trị cho Admin

- Tìm được người dùng khi cần hỗ trợ.
- Khóa tài khoản có hành vi không phù hợp.
- Xác minh HR trước khi cho phép đăng tin.

### A. Trang danh sách người dùng

#### Bộ lọc

- Tìm theo tên hoặc email.
- Role: Candidate, HR, Admin.
- Trạng thái: đang hoạt động, đã khóa.
- Trạng thái HR: chờ xác minh, đã xác minh.

#### Các cột

| Cột | Nội dung |
|---|---|
| Người dùng | Họ tên và email |
| Role | Candidate/HR/Admin |
| Trạng thái | Hoạt động/Đã khóa |
| Xác minh | Dùng cho HR |
| Ngày tạo | Thời điểm đăng ký |
| Thao tác | Xem chi tiết |

### B. Trang chi tiết người dùng

Hiển thị:

- Họ tên, email, role.
- Trạng thái tài khoản.
- Ngày tạo.
- Số Job đã tạo nếu là HR.
- Số Application nếu là Candidate.
- Các hoạt động gần đây.

### C. Các thao tác

#### Khóa tài khoản

- Admin chọn “Khóa tài khoản”.
- Hiển thị hộp thoại xác nhận.
- Yêu cầu nhập lý do ngắn.
- Sau khi khóa, user không thể đăng nhập.

#### Mở khóa

- Chỉ hiển thị với tài khoản đang bị khóa.
- Yêu cầu xác nhận trước khi thực hiện.

#### Xác minh HR

Đối với MVP, không cần quy trình giấy tờ phức tạp. Có thể hiển thị:

- Tên công ty.
- Email công việc.
- Website công ty.
- Ghi chú do HR cung cấp.

Admin chọn:

- `Xác minh`.
- `Yêu cầu bổ sung`.
- `Từ chối`.

### Quy tắc đơn giản

- Admin không được tự khóa chính mình.
- Không xóa user; chỉ khóa hoặc mở khóa.
- HR chưa được xác minh có thể tạo bản nháp Job nhưng không được đăng công khai.
- Các thao tác khóa/xác minh cần có lý do và được ghi vào lịch sử hoạt động.

### Tiêu chí hoàn thành

- Có list, search, filter và detail.
- Khóa/mở khóa làm thay đổi trạng thái trên giao diện.
- Có một luồng xác minh HR hoàn chỉnh bằng mock data.

---

## 5.3. Quản lý việc làm

### Mục đích

Cho phép admin xem toàn bộ Job do HR tạo và kiểm soát Job nào được hiển thị công khai.

### Giá trị cho Admin

- Hạn chế tin rác hoặc nội dung không phù hợp.
- Kiểm tra Job đã có đủ dữ liệu để AI matching hay chưa.
- Theo dõi số lượng ứng viên của từng Job.

### Trạng thái Job đề xuất

| Trạng thái | Ý nghĩa |
|---|---|
| `PENDING` | HR đã gửi, chờ Admin duyệt |
| `PUBLISHED` | Đang hiển thị cho Candidate |
| `HIDDEN` | Bị Admin tạm ẩn |
| `CLOSED` | HR đã đóng hoặc hết hạn |

Bốn trạng thái là đủ cho MVP. Không cần workflow nhiều bước.

### A. Trang danh sách Job

#### Bộ lọc

- Tìm theo tiêu đề.
- HR đăng tin.
- Trạng thái.
- Job Family.
- Career Level.

#### Các cột

| Cột | Nội dung |
|---|---|
| Tiêu đề Job | Tên vị trí |
| HR | Người tạo |
| Nhóm nghề | Job Family |
| Cấp bậc | Career Level |
| Ứng viên | Số Application |
| Trạng thái | Pending/Published/Hidden/Closed |
| Ngày tạo | Thời gian |

### B. Trang chi tiết Job

Chia thành ba phần:

#### Thông tin chung

- Tiêu đề, địa điểm, loại công việc.
- Mô tả, yêu cầu và quyền lợi.
- HR tạo Job.
- Ngày hết hạn.

#### Cấu hình matching

- Job Family.
- Career Level.
- Danh sách kỹ năng yêu cầu.
- Cấp độ và trọng số của từng kỹ năng.
- Kỹ năng bắt buộc hay không.

Admin chỉ cần xem cấu hình để biết Job có đủ dữ liệu. Việc chỉnh yêu cầu chi tiết vẫn thuộc HR.

#### Thống kê ngắn

- Số người đã ứng tuyển.
- Số hồ sơ AI đã xử lý thành công.
- Điểm phù hợp trung bình, chỉ dùng tham khảo.

### C. Các thao tác

- `Duyệt và đăng`: chuyển `PENDING → PUBLISHED`.
- `Từ chối`: giữ Job không công khai và ghi lý do.
- `Ẩn tin`: chuyển `PUBLISHED → HIDDEN`.
- `Hiển thị lại`: chuyển `HIDDEN → PUBLISHED`.

### Quy tắc đơn giản

- Job phải có tiêu đề, mô tả, yêu cầu, Job Family và ít nhất một kỹ năng trước khi được duyệt.
- Admin không sửa nội dung Job thay HR; nếu sai thì từ chối kèm lý do.
- Ẩn Job không xóa các Application đã tồn tại.
- Admin không thay đổi trạng thái tuyển dụng của ứng viên.

### Tiêu chí hoàn thành

- Hiển thị được Job theo bốn trạng thái.
- Có preview nội dung và cấu hình matching.
- Duyệt/ẩn Job cập nhật lại danh sách và Dashboard.

---

## 5.4. Hồ sơ ứng tuyển và theo dõi AI

### Mục đích

Cho admin theo dõi quá trình AI xử lý CV và hỗ trợ khi hồ sơ bị lỗi.

### Giá trị cho Admin

- Biết hồ sơ đang xử lý đến đâu.
- Xem được kết quả AI ở dạng dễ hiểu.
- Chạy lại hồ sơ bị lỗi mà không cần thao tác trực tiếp với server.
- Tạo điểm nhấn rõ cho đồ án Multi-Agent.

### Hai loại trạng thái cần tách

#### Trạng thái tuyển dụng

Do HR quản lý:

`PENDING | REVIEWING | SHORTLISTED | REJECTED | HIRED`

#### Trạng thái AI

Do hệ thống cập nhật:

`WAITING | PROCESSING | COMPLETED | FAILED | NEEDS_REVIEW`

Ví dụ một ứng viên có thể đang `REVIEWING` về tuyển dụng nhưng AI đã `COMPLETED`. Không nên dùng chung một trạng thái cho cả hai việc.

### A. Trang danh sách Application

#### Bộ lọc

- Tìm theo Application ID, Candidate hoặc Job.
- Trạng thái tuyển dụng.
- Trạng thái AI.
- Khoảng điểm phù hợp.
- Ngày ứng tuyển.

#### Các cột

| Cột | Nội dung |
|---|---|
| Candidate | Họ tên |
| Job | Vị trí ứng tuyển |
| Trạng thái tuyển dụng | Do HR quản lý |
| Trạng thái AI | Waiting/Processing/... |
| Điểm phù hợp | 0–100 nếu đã có |
| Cảnh báo | Số cảnh báo AI |
| Ngày nộp | Thời gian |

### B. Trang chi tiết Application

#### Tab 1 — Tổng quan

- Candidate và Job.
- Hai trạng thái độc lập.
- Điểm phù hợp.
- Thời gian xử lý.
- Thông báo lỗi hoặc cảnh báo nếu có.

#### Tab 2 — Dữ liệu CV đã bóc tách

- Kỹ năng.
- Kinh nghiệm.
- Học vấn.
- Ngôn ngữ CV.
- Phương pháp: NER hoặc LLM fallback.
- Độ tin cậy tổng thể.

Không cần hiển thị raw CV hoặc log kỹ thuật dài. Chỉ hiển thị dữ liệu đã cấu trúc để demo.

#### Tab 3 — Kết quả Matching

- Điểm phù hợp tổng.
- Kỹ năng đã đáp ứng.
- Kỹ năng còn thiếu.
- Điểm theo nhóm: hard skill, soft skill, kinh nghiệm.
- Lý do AI đề xuất HR xem xét hoặc từ chối.

Giao diện cần có ghi chú:

> Điểm phù hợp là kết quả so sánh với yêu cầu Job, không phải xác suất chắc chắn được tuyển.

#### Tab 4 — Career Path

Nếu có kết quả:

- Các kỹ năng cần cải thiện.
- Lộ trình theo giai đoạn.
- Hoạt động đề xuất.
- Tài nguyên học tập.

Nếu chưa có hoặc lỗi, hiển thị trạng thái phù hợp thay vì trang trắng.

### C. Theo dõi tiến trình AI

Chỉ cần stepper đơn giản:

```text
Đã nhận CV
→ Bóc tách dữ liệu
→ So khớp với Job
→ Tạo Career Path (nếu cần)
→ Hoàn thành
```

Mỗi bước có trạng thái hoàn thành, đang chạy hoặc lỗi.

### D. Thao tác của Admin

#### Chạy lại

Hiển thị khi `ai_status = FAILED`.

- Admin xem thông báo lỗi ngắn.
- Chọn “Chạy lại”.
- Xác nhận thao tác.
- Trạng thái chuyển về `WAITING`, sau đó mô phỏng `PROCESSING → COMPLETED`.

Không cho chạy lại khi lỗi do file sai định dạng; trường hợp này cần Candidate tải CV mới.

#### Đánh dấu cần kiểm tra

Nếu độ tin cậy thấp hoặc Career Path có cảnh báo, admin có thể đặt `NEEDS_REVIEW`. Trong MVP, đây chỉ là một nhãn để quản lý, không cần xây Review Queue riêng.

### Quy tắc đơn giản

- Admin không sửa trực tiếp điểm AI.
- Chạy lại không thay đổi trạng thái tuyển dụng.
- Không hiển thị API key, stack trace hoặc prompt nội bộ.
- Chỉ hiển thị thông báo lỗi dễ hiểu như “Không đọc được nội dung CV” hoặc “AI Service tạm thời không phản hồi”.

### Tiêu chí hoàn thành

- Danh sách hiển thị hai trạng thái riêng.
- Detail có dữ liệu CV, matching và Career Path.
- Có stepper tiến trình.
- Có một ca lỗi chạy lại thành công và một ca lỗi không được chạy lại.

---

## 5.5. Quản lý dữ liệu năng lực

### Mục đích

Quản lý dữ liệu nền mà HR và AI sử dụng khi cấu hình Job, matching và tạo lộ trình.

### Giá trị cho Admin

- Danh sách kỹ năng được thống nhất, tránh HR nhập nhiều tên khác nhau cho cùng một kỹ năng.
- Cấp độ kỹ năng có mô tả rõ hơn một con số.
- Thể hiện hệ thống AI có dữ liệu quản lý được, không chỉ dựa vào prompt.

### Phạm vi MVP

Chỉ cần ba nhóm:

1. Job Families.
2. Career Levels.
3. Competencies và Competency Levels.

Learning Resources là P1. Không cần làm giao diện quản lý scoring rule, pedigree, market data hoặc phiên bản Knowledge Base trong MVP.

### A. Job Families

Ví dụ: Engineering, Sales & Marketing, Finance.

#### Chức năng

- Xem danh sách.
- Thêm mới.
- Chỉnh sửa tên và mô tả.
- Bật/tắt sử dụng.

#### Trường dữ liệu

- Tên nhóm nghề.
- Mã ngắn.
- Mô tả.
- Trạng thái.

### B. Career Levels

Ví dụ: Intern, Junior, Middle, Senior.

#### Chức năng

- Xem danh sách.
- Thêm/chỉnh sửa.
- Sắp xếp theo `rank_value`.

#### Trường dữ liệu

- Tên cấp bậc.
- Giá trị thứ tự.
- Mô tả ngắn.

### C. Competencies

#### Danh sách

Các cột:

- Tên kỹ năng/năng lực.
- Loại: Hard Skill, Soft Skill, Experience.
- Mô tả.
- Số Job đang sử dụng.
- Trạng thái.

Bộ lọc theo tên, loại và trạng thái.

#### Form tạo/chỉnh sửa

- Tên.
- Loại.
- Mô tả.
- Trạng thái hoạt động.

#### Mô tả cấp độ 1–5

Mỗi competency có thể có năm level:

| Level | Ví dụ nhãn | Ý nghĩa chung |
|---|---|---|
| 1 | Biết cơ bản | Hiểu khái niệm, cần hướng dẫn |
| 2 | Có thể thực hành | Làm được tác vụ đơn giản |
| 3 | Làm việc độc lập | Hoàn thành công việc thông thường |
| 4 | Thành thạo | Xử lý vấn đề khó và hỗ trợ người khác |
| 5 | Chuyên gia | Thiết kế, dẫn dắt hoặc tối ưu hệ thống |

Admin nhập mô tả cụ thể cho từng kỹ năng. Ví dụ Java level 3: “Có thể xây dựng REST API cơ bản bằng Spring Boot và viết unit test cho service”.

### D. Learning Resources — P1

Nếu còn thời gian, thêm tab tài nguyên học tập:

- Tiêu đề.
- Nhà cung cấp.
- URL.
- Kỹ năng liên quan.
- Cấp độ phù hợp.
- Ngôn ngữ.
- Miễn phí/trả phí.

Career Path chỉ chọn tài nguyên có trong danh sách này. Đây là phần mở rộng đẹp nhưng không bắt buộc.

### Quy tắc đơn giản

- Không cho trùng tên competency sau khi bỏ khoảng trắng thừa.
- Level chỉ từ 1 đến 5.
- Không xóa competency đang được Job sử dụng; chỉ tắt hoạt động.
- Competency đã tắt không xuất hiện khi HR cấu hình Job mới.
- Tên và mô tả là bắt buộc.

### Tiêu chí hoàn thành

- CRUD được Job Family, Career Level và Competency bằng mock data.
- Có màn hình chỉnh mô tả level 1–5.
- Khi tắt competency, dữ liệu cũ vẫn hiển thị nhưng không dùng cho Job mới.

---

## 5.6. Báo cáo và lịch sử hoạt động — P1

### Mục đích

Cung cấp một số thống kê và cho biết Admin đã thực hiện những thao tác nào.

### Báo cáo đề xuất

Chỉ cần ba báo cáo:

1. Số user/job/application theo tháng.
2. Số hồ sơ AI hoàn thành và thất bại.
3. Số application theo Job Family hoặc trạng thái tuyển dụng.

### Lịch sử hoạt động

Các sự kiện cần lưu trong demo:

- Khóa/mở tài khoản.
- Xác minh HR.
- Duyệt/ẩn Job.
- Chạy lại AI.
- Thêm/sửa/tắt competency.

Mỗi dòng gồm thời gian, Admin, hành động, đối tượng và lý do ngắn.

Không cần xây audit log chuẩn doanh nghiệp, xuất báo cáo phức tạp hoặc dashboard BI.

---

## 6. Các luồng demo chính

### 6.1. Xác minh HR

```text
Dashboard báo có HR chờ xác minh
→ Admin mở danh sách người dùng
→ Xem thông tin HR
→ Chọn Xác minh hoặc Yêu cầu bổ sung
→ Trạng thái được cập nhật
→ Hoạt động được ghi lại
```

### 6.2. Duyệt Job

```text
Job ở trạng thái PENDING
→ Admin xem nội dung và cấu hình kỹ năng
→ Duyệt để chuyển sang PUBLISHED
hoặc từ chối kèm lý do
```

### 6.3. Xử lý hồ sơ AI bị lỗi

```text
Dashboard báo AI FAILED
→ Mở Application detail
→ Xem bước bị lỗi
→ Nếu được phép thì chọn Chạy lại
→ WAITING → PROCESSING → COMPLETED
→ Xem kết quả matching mới
```

### 6.4. Quản lý competency

```text
Admin tạo competency “Docker”
→ Chọn loại Hard Skill
→ Nhập mô tả level 1–5
→ Lưu
→ Competency xuất hiện trong danh sách cấu hình Job
```

Bốn luồng này đủ tạo một bài demo có câu chuyện, thay vì chỉ mở từng trang và đọc bảng dữ liệu.

---

## 7. Dữ liệu cần bổ sung ở mức tối thiểu

Không cần thay đổi lớn cơ sở dữ liệu. Có thể giữ phần lớn schema hiện có và chỉ cân nhắc các bổ sung sau khi làm backend.

| Đối tượng | Hiện có | Bổ sung tối thiểu |
|---|---|---|
| User | role, is_active | `verification_status` cho HR |
| Job | is_active | `status`: PENDING/PUBLISHED/HIDDEN/CLOSED |
| Application | recruitment status, score, feedback | `ai_status`, `ai_error_message` |
| Competency | name, category, description | Có thể dùng nguyên trạng |
| Competency Level | level, label, description | Có thể dùng nguyên trạng |
| Activity Log | Chưa có | Bảng đơn giản nếu làm P1 |
| Learning Resource | Mới ở schema logic AI | Chỉ thêm nếu làm P1 |

### Gợi ý `activity_logs` đơn giản

```text
id
admin_id
action
target_type
target_id
description
created_at
```

Không cần lưu lịch sử thay đổi quá chi tiết hoặc thông tin hạ tầng trong MVP.

### Lưu ý

Frontend demo chưa cần thay đổi cơ sở dữ liệu. Các trường trên được mô phỏng trước và backend có thể bổ sung sau.

---

## 8. Thiết kế dữ liệu mock cho Frontend

### 8.1. Nguyên tắc

- Component không đọc file JSON trực tiếp.
- Tạo một lớp `adminService` giả lập API.
- Cách gọi dữ liệu nên gần giống API để sau này dễ thay thế.
- Dữ liệu cố định, không dùng random khiến demo thay đổi.
- Thao tác duyệt/khóa/retry phải thật sự cập nhật dữ liệu mock.

### 8.2. Các nhóm dữ liệu mock

| Nhóm | Thông tin chính |
|---|---|
| User | ID, tên, email, role, trạng thái, xác minh HR |
| Job | ID, tiêu đề, HR, nhóm nghề, cấp bậc, trạng thái |
| Application | Candidate, Job, trạng thái tuyển dụng, trạng thái AI, điểm |
| Competency | Tên, loại, mô tả, level 1–5, trạng thái |
| Activity | Admin, hành động, đối tượng, thời gian |

Các trạng thái trong mock phải dùng đúng những trạng thái đã chốt ở phần chức năng, tránh mỗi màn hình đặt một tên khác nhau.

### 8.3. Lớp dữ liệu giả lập

Nên tạo một `adminService` đứng giữa giao diện và dữ liệu mock. Các trang chỉ gọi service để lấy danh sách, xem chi tiết hoặc cập nhật trạng thái. Sau này có backend, thay phần xử lý bên trong service bằng HTTP request mà không phải sửa lại toàn bộ component.

Các thao tác tối thiểu cần mô phỏng:

- Lấy số liệu Dashboard.
- Tìm/lọc user, Job và Application.
- Khóa/mở user và xác minh HR.
- Duyệt/ẩn Job.
- Chạy lại AI.
- Thêm/sửa/tắt competency.

### 8.4. Dữ liệu demo nên có

- Khoảng 15–20 user.
- 3 HR: một đã xác minh, một đang chờ, một bị từ chối.
- 8–12 Job với đủ bốn trạng thái.
- 20–30 Application.
- Một hồ sơ AI đang xử lý.
- Một hồ sơ lỗi có thể retry.
- Một hồ sơ lỗi do file không hợp lệ và không thể retry.
- 10–15 competencies thuộc nhiều loại.
- Ít nhất một competency chưa đủ mô tả level để tạo cảnh báo.

### 8.5. Trạng thái mô phỏng

Khi chọn retry:

```text
FAILED
→ WAITING trong khoảng ngắn
→ PROCESSING
→ COMPLETED
```

Có thể dùng thời gian chờ cố định để mô phỏng. Chưa cần kết nối xử lý thời gian thực ở giai đoạn frontend.

---

## 9. Backend cần hỗ trợ gì sau này?

Khi chuyển từ mock sang backend, mỗi module chỉ cần các nhóm API sau:

| Module | API cần có |
|---|---|
| Dashboard | Lấy số liệu tổng hợp và danh sách cần xử lý |
| User | Lấy danh sách/chi tiết, khóa/mở, xác minh HR |
| Job | Lấy danh sách/chi tiết, duyệt, từ chối, ẩn/hiện |
| Application | Lấy danh sách/chi tiết và chạy lại AI |
| Dữ liệu năng lực | Thêm, xem, sửa và tắt family/level/competency |
| Activity | Lấy lịch sử thao tác nếu làm P1 |

Không cần thiết kế toàn bộ API ngay khi làm frontend. Điều quan trọng là frontend dùng một lớp service thống nhất và backend sau này kiểm tra đúng role Admin.

---

## 10. Các trạng thái giao diện cần có

Mỗi trang chính nên có:

- **Loading:** skeleton hoặc spinner.
- **Empty:** chưa có dữ liệu.
- **No result:** không có kết quả phù hợp bộ lọc.
- **Error:** tải dữ liệu thất bại, có nút thử lại.
- **Success:** toast sau thao tác.
- **Confirm:** trước khi khóa user, ẩn Job hoặc retry AI.

Form cần hiển thị lỗi ngay cạnh trường:

- Tên bắt buộc.
- Email không hợp lệ.
- Level ngoài 1–5.
- Job chưa có kỹ năng.
- Lý do chưa được nhập khi khóa/từ chối.

Không cần xử lý mọi HTTP status hiếm gặp trong frontend demo. Chỉ cần làm tốt các trạng thái người dùng thực sự nhìn thấy.

---

## 11. Yêu cầu bảo mật cơ bản

MVP chỉ cần các nguyên tắc sau:

- Chỉ role `ADMIN` truy cập đường dẫn `/admin`.
- Backend sau này kiểm tra quyền cho mọi API admin.
- Không hiển thị password, token, API key hoặc biến `.env`.
- Không ghi raw CV vào log frontend.
- Nội dung Job cần được render an toàn, không chạy HTML/script tùy ý.
- Không cho Admin sửa trực tiếp điểm AI hoặc quyết định tuyển dụng.
- Dữ liệu demo phải là dữ liệu giả.

Không cần xây hệ thống bảo mật, audit hoặc compliance cấp doanh nghiệp trong phạm vi đồ án.

---

## 12. Kế hoạch triển khai Frontend

### Giai đoạn 1 — Khung Admin và dữ liệu mock

- Admin layout, sidebar, top bar.
- Route `/admin`.
- Badge, table, modal, toast.
- `adminService` và mock data.

**Kết quả:** có thể mở admin, điều hướng và hiển thị bảng mẫu.

### Giai đoạn 2 — User và Job

- User list/detail.
- Khóa/mở và xác minh HR.
- Job list/detail.
- Duyệt/ẩn Job.

**Kết quả:** demo được hai luồng quản trị cơ bản.

### Giai đoạn 3 — Application và AI

- Application list/detail.
- Hai loại trạng thái.
- CV extraction, matching, Career Path tabs.
- Stepper và retry AI.

**Kết quả:** hoàn thành điểm nhấn Multi-Agent.

### Giai đoạn 4 — Dữ liệu năng lực

- Job Family.
- Career Level.
- Competency.
- Level editor 1–5.

**Kết quả:** chứng minh AI sử dụng dữ liệu có quản lý.

### Giai đoạn 5 — Dashboard và hoàn thiện

- Dashboard tổng hợp từ dữ liệu mock.
- Activity log/báo cáo nếu còn thời gian.
- Responsive cơ bản.
- Loading, empty, error states.
- Kiểm thử các luồng demo.

### Ước lượng hợp lý

Nếu một sinh viên làm chính frontend:

- Phần P0: khoảng 5–7 tuần.
- Phần P1: thêm 1–2 tuần.

Thời gian thực tế phụ thuộc thư viện UI và mức độ hoàn thiện giao diện. Nếu trễ, bỏ Reports và Learning Resources trước; không nên bỏ phần theo dõi AI hoặc Competency Levels.

---

## 13. Kịch bản trình bày với hội đồng

Kịch bản khoảng 6–8 phút:

1. **Dashboard:** giới thiệu số liệu và một hồ sơ AI bị lỗi.
2. **User:** xác minh một HR đang chờ.
3. **Job:** xem cấu hình kỹ năng và duyệt một Job.
4. **Application:** mở hồ sơ lỗi, xem stepper và chạy lại AI.
5. **Kết quả AI:** xem CV đã bóc tách, điểm matching và Career Path.
6. **Dữ liệu năng lực:** mở competency Java/Docker và giải thích level 1–5.
7. **Lịch sử:** cho thấy các thao tác vừa thực hiện đã được ghi lại nếu có P1.

Thông điệp chính:

> Admin không chỉ quản lý user và Job, mà còn giúp theo dõi chất lượng xử lý AI và quản lý dữ liệu năng lực làm nền cho kết quả matching.

---

## 14. Những chức năng không làm trong MVP

Để tránh dự án bị quá lớn, không đưa các nội dung sau vào phạm vi chính:

- Nhiều cấp Admin hoặc phân quyền tùy chỉnh.
- Quản lý nhiều công ty/tenant phức tạp.
- Quy trình xác minh doanh nghiệp bằng giấy tờ.
- Knowledge Base versioning và đồng bộ cache AI.
- Policy editor cho ngưỡng điểm, model hoặc prompt.
- Quản trị RabbitMQ, Redis, Database hoặc restart service.
- Notification template/campaign.
- Market intelligence và nguồn dữ liệu thị trường.
- Fairness dashboard theo thuộc tính nhạy cảm.
- Export/xóa dữ liệu theo quy trình pháp lý phức tạp.
- Báo cáo BI tùy chỉnh.
- Audit log chuẩn doanh nghiệp.
- Sửa score hoặc output AI bằng tay.

Các ý tưởng này có thể ghi trong “hướng phát triển” của báo cáo đồ án, nhưng không nên đưa vào backlog frontend hiện tại.

---

## 15. Definition of Done

Admin Dashboard MVP được xem là hoàn thành khi:

- Có layout và điều hướng riêng cho Admin.
- Có Dashboard với số liệu và danh sách cần xử lý.
- Quản lý được user và luồng xác minh HR bằng mock data.
- Quản lý được Job và bốn trạng thái cơ bản.
- Application hiển thị riêng trạng thái tuyển dụng và AI.
- Xem được dữ liệu CV đã bóc tách, matching và Career Path.
- Có một luồng retry AI hoạt động trên giao diện.
- Quản lý được Job Family, Career Level và Competency Levels.
- Các thao tác cập nhật đồng bộ danh sách, chi tiết và Dashboard.
- Có loading, empty, error và confirm state ở các màn hình chính.
- Mock data không chứa dữ liệu cá nhân thật.
- Code tách lớp dữ liệu mock để sau này thay bằng API.
- Có thể chạy trọn kịch bản demo 6–8 phút mà không cần sửa dữ liệu thủ công.

---

## 16. Đề xuất cuối cùng

Phạm vi phù hợp nhất cho đồ án là:

```text
Dashboard
+ User Management
+ Job Moderation
+ Application/AI Monitoring
+ Competency Management
```

Trong đó:

- **User và Job** giúp sản phẩm có đầy đủ chức năng quản trị cơ bản.
- **AI Monitoring** tạo điểm nhấn Multi-Agent.
- **Competency Management** chứng minh hệ thống có nền dữ liệu rõ ràng, không chỉ gọi LLM để sinh kết quả.

Reports, Learning Resources và Activity Log chỉ nên làm sau khi năm phần chính đã ổn định. Với phạm vi này, dự án vẫn đủ chiều sâu để trình bày tốt nhưng không tạo cảm giác đang xây một hệ thống tuyển dụng doanh nghiệp hoàn chỉnh.
