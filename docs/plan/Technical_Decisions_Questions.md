# TÀI LIỆU CÂU HỎI VÀ QUYẾT ĐỊNH KỸ THUẬT (TECHNICAL DECISION QUESTIONS)

**Mục đích:** Bản kế hoạch tổng quan đã làm rõ "Vấn đề và Giải pháp". Tài liệu này đi sâu vào "Cách thực thi" (The How). Đây là danh sách các câu hỏi, các luồng kiến trúc và các quyết định kỹ thuật cốt lõi mà Team Dev cần họp và chốt hạ (Sign-off) với Giáo viên hướng dẫn trước khi viết dòng code đầu tiên.

---

## PHẦN I. LUỒNG HOẠT ĐỘNG DỰ KIẾN (SYSTEM FLOW)

Để team dễ hình dung, vòng đời của một file CV khi đưa vào hệ thống sẽ đi qua luồng (Flow) như sau:

1. **Upload & Tiền xử lý:** HR tải file CV (PDF/Docx) lên Web. Backend nhận file, dùng công cụ OCR/Text Extraction để biến CV thành chuỗi văn bản (Raw Text).
2. **State Machine Khởi động (LangGraph):** Backend kích hoạt luồng LangGraph, khởi tạo một "Trạng thái" (State) rỗng để luân chuyển dữ liệu giữa các AI.
3. **Node 1 - CV Analysis:** Supervisor Agent gọi CV Agent. CV Agent dùng LLM đọc Raw Text, ép LLM bóc tách thông tin thành cấu trúc JSON (Tên, Kỹ năng, Học vấn, Kinh nghiệm...). Dữ liệu JSON này được lưu cứng vào PostgreSQL.
4. **Node 2 - Skill Gap Analysis:** HR chọn một Job Description (JD). Supervisor gọi Skill Gap Agent. Agent này nhúng (Embed) kỹ năng của ứng viên và JD thành các Vector, dùng Database (pgvector) để tính độ tương đồng (Semantic Search). Sau đó áp dụng "Công thức trọng số" để ra điểm số cuối cùng (Ví dụ: Match 85%).
5. **Node 3 - Điểm dừng HITL (Human-in-the-Loop):** Hệ thống tạm dừng thực thi AI. Giao diện Web hiển thị kết quả 85% và danh sách "Kỹ năng thiếu hụt". HR kiểm tra và bấm nút `[Phê duyệt đánh giá]`.
6. **Node 4 - Career Pathway:** Supervisor nhận lệnh duyệt từ giao diện, liền gọi Career Advisor Agent. Dựa trên kỹ năng thiếu hụt, Agent này sinh ra lộ trình học tập (Text/Markdown) và cập nhật vào Database.
7. **Kết thúc:** Trả toàn bộ kết quả phân tích và lộ trình học tập về Giao diện Web (Dashboard) cho HR xem.

---

## PHẦN II. CÁC QUYẾT ĐỊNH KỸ THUẬT CẦN TEAM CHỐT HẠ (OPEN QUESTIONS)

Đây là các vấn đề xương sống. Việc chọn công nghệ nào sẽ ảnh hưởng trực tiếp đến khối lượng code, ngân sách và rủi ro fail đồ án. Team cần thảo luận, chọn Phương án (Option) và ghi chú lý do vào biên bản.

### 1. Xử lý file CV (PDF Parsing) - Bước đau đầu nhất
CV có muôn vàn layout (chia 2 cột, chia 3 cột, chèn ảnh, dùng icon). Đọc file PDF sai thì AI cũng sẽ phân tích sai 100%.
- **Câu hỏi:** Chúng ta dùng công cụ nào để bóc tách chữ từ PDF trước khi đưa cho LLM?
  - *Option A:* Dùng thư viện trích xuất Text (`pdfplumber`, `PyMuPDF`). Ưu điểm: Nhanh, chạy local, miễn phí. Nhược điểm: CV chia 2 cột rất dễ bị dính chữ đọc không hiểu.
  - *Option B:* Dùng LLM Vision. Nghĩa là chụp ảnh CV (convert PDF to Image) rồi đưa nguyên bức ảnh cho LLM (như GPT-4o / Gemini 1.5 Pro Vision) tự nhìn và đọc. Ưu điểm: Siêu chuẩn xác với mọi cấu trúc. Nhược điểm: Phí API đắt, tốn thời gian gọi API lâu hơn.
- **=> Quyết định của team:** _________

### 2. Chọn Mô hình Ngôn ngữ Lớn (LLM Foundation)
Đề tài liên quan đến AI, GVHD chắc chắn sẽ hỏi tại sao chọn mô hình này.
- **Câu hỏi:** Hệ thống gọi API của mô hình nào làm "Não bộ" chính cho các Agent?
  - *Option A:* **GPT-4o (OpenAI)**. Ưu điểm: Thông minh nhất, hỗ trợ tính năng "Structured Outputs" cực tốt (đảm bảo trả về đúng format JSON). Nhược điểm: Trả phí API.
  - *Option B:* **Gemini 1.5 Flash/Pro (Google)**. Ưu điểm: Context window siêu lớn (chấp 100 trang CV), xử lý nhanh, giá rẻ hơn.
  - *Option C:* **Local LLM (Llama 3 chạy cục bộ)**. Ưu điểm: Bảo mật tuyệt đối (không gửi CV của người ta lên Cloud), miễn phí. Nhược điểm: Team phải có máy mạnh (GPU) để chạy, AI ngu hơn, setup khó.
- **=> Quyết định của team:** _________

### 3. Ngôn ngữ lập trình Backend & Framework Multi-Agent
Hệ thống AI hiện nay có thể code bằng JS/TS hoặc Python.
- **Câu hỏi:** Stack công nghệ cho Backend là gì?
  - *Option A:* **Python (FastAPI + LangGraph thuần)**. Ưu điểm: Python là Vua của AI, có đủ mọi thư viện (pgvector, langchain...). Tối ưu nhất cho xử lý Vector.
  - *Option B:* **NodeJS (NestJS/Express + LangGraph.js)**. Ưu điểm: Team code mượt JS, dùng chung ngôn ngữ hệ sinh thái với Frontend. Nhược điểm: Một số thư viện liên quan đến NLP hỗ trợ cho JS chậm hơn Python.
- **=> Quyết định của team:** _________

### 4. Chiến lược nhúng dữ liệu (Embedding Model) cho Tiếng Việt
Để so khớp CV và JD bằng Vector, chúng ta phải biến chữ thành các dãy số (Embed).
- **Câu hỏi:** Dùng mô hình Embedding nào để hỗ trợ CV tiếng Việt tốt nhất?
  - *Option A:* `text-embedding-3-small` (OpenAI API). Hỗ trợ đa ngôn ngữ, nhanh, không phải nuôi server.
  - *Option B:* Mô hình mã nguồn mở `BAAI/bge-m3` hoặc `dangvantuan/vietnamese-embedding` (Chạy local). Tốt riêng cho tiếng Việt nhưng phải dựng server để chạy nó.
- **=> Quyết định của team:** _________

### 5. Cơ chế quản lý Trạng thái (State Management) trong LangGraph
LangGraph truyền dữ liệu giữa các Agent thông qua một "State" (bộ nhớ dùng chung như Redux).
- **Câu hỏi:** Khi CV và kết quả phân tích ngày càng dài, State sẽ phình to. Quản lý như thế nào để đỡ tốn tiền token?
  - *Option A:* Bê nguyên cục dữ liệu (Full State). Agent nào cũng nhận được cục JSON khổng lồ (Dễ code, nhưng tốn Token API vì gọi tới gọi lui).
  - *Option B:* State phân mảnh (Reference State). CV Agent bóc tách xong thì lưu xuống DB, sau đó chỉ truyền cái ID (`cv_id: 123`) sang cho Skill Gap Agent. Skill Gap Agent tự query DB lên để làm tiếp. (Tiết kiệm Token cực nhiều, nhưng code Logic phức tạp hơn).
- **=> Quyết định của team:** _________

### 6. Cấu trúc Hybrid Matching (Ma trận điểm số)
Hệ thống của chúng ta kết hợp AI (Vector) và Toán học (Matrix).
- **Câu hỏi:** Điểm cuối cùng (Final Score) sẽ tính như thế nào? Các trọng số này có để cho HR tự sửa trên Web được không?
  - *Thiết kế hệ thống:* Hệ thống có nên tạo một bảng config (ví dụ: Kỹ năng mềm = 20%, Kỹ năng cứng = 50%, Kinh nghiệm = 30%). Khi AI tính ra điểm Vector thì nhân tiếp với các số này.
  - *Câu hỏi:* Điểm số nên hiển thị thành % (85%), hay hiển thị điểm tuyệt đối (75/100)?
- **=> Quyết định của team:** _________

---

**LỜI KHUYÊN DÀNH CHO TEAM:**
1. Hãy tổ chức một buổi họp/Discord, mở file này lên và điền (Option A, B, C...) vào các chỗ trống.
2. Với đồ án tốt nghiệp, thường **Option A (Python)** kết hợp **Option B (Gemini API - vì rẻ/rộng) hoặc Option A (GPT-4o)** là an toàn nhất.
3. Sau khi file này được điền xong, hệ thống sẽ có đủ dữ kiện để vẽ sơ đồ Kiến trúc (Architecture Diagram) và phác thảo Database Schema chuẩn xác.
