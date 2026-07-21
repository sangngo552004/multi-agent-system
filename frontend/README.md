# Multi-Agent Career Platform — Frontend

Frontend Next.js App Router dùng chung cho ba không gian:

- Candidate: `/candidate/*`
- HR/Nhà tuyển dụng: `/hr/*`
- Admin: `/admin/*`

Toàn bộ 5 phase của Admin MVP đã được triển khai bằng mock data: Dashboard, người dùng/xác minh HR, kiểm duyệt tin tuyển dụng, theo dõi hồ sơ và AI, Kho năng lực, Nhật ký hoạt động và Báo cáo cơ bản. Các route HR và Candidate hiện vẫn là placeholder để các thành viên khác phát triển song song.

## Chạy dự án

```bash
npm ci
npm run dev
```

Mở [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard).

## Kiểm tra

```bash
npm run lint
npm run build
```

## Dữ liệu demo

Frontend chưa gọi backend. Feature sử dụng luồng `TanStack Query → adminService → mock adapter → MockDatabase`, vì vậy có thể thay mock adapter bằng HTTP adapter sau này mà không cần viết lại giao diện.

Các luồng chính đã hoạt động:

- Quản lý tài khoản, xác minh HR, khóa/mở tài khoản có lý do.
- Duyệt, trả về HR, ẩn hoặc hiển thị lại tin tuyển dụng.
- Theo dõi riêng trạng thái tuyển dụng và xử lý AI của hồ sơ.
- Xem Extraction, Matching, Career Path và chạy lại case AI có thể retry.
- Thêm/sửa/ngưng sử dụng nhóm nghề, cấp bậc và năng lực.
- Chỉnh sửa thang năng lực 5 cấp độ với xem trước trực tiếp.
- Theo dõi Nhật ký hoạt động và Báo cáo trong 7/30 ngày.

Cuối sidebar có ba kịch bản **Chuẩn**, **Trống**, **Lỗi AI** và nút **Khôi phục dữ liệu** để chuẩn bị lại demo.

Đọc [STRUCTURE.md](STRUCTURE.md) trước khi mở rộng feature và [kế hoạch Admin Dashboard](../docs/admin_dashboard_plan.md) để xem phạm vi của từng phase.
