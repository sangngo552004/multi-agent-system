# Hệ thống tuyển dụng nội bộ ứng dụng Multi-Agent AI — Frontend

Frontend Next.js App Router dùng chung cho ba không gian:

- Candidate: `/candidate/*`
- HR nội bộ: `/hr/*`
- Admin: `/admin/*`

Toàn bộ 5 phase của Admin MVP đã được triển khai bằng mock data theo mô hình một tổ chức: Dashboard, quản lý tài khoản, giám sát cấu hình tuyển dụng, vận hành AI, Kho năng lực, Nhật ký hoạt động và Báo cáo cơ bản. Các route HR và Candidate hiện vẫn là placeholder để các thành viên khác phát triển song song.

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

- Quản lý tài khoản nội bộ và ứng viên, khóa/mở quyền truy cập có lý do.
- Theo dõi tin do HR quản lý và phát hiện cấu hình AI chưa hoàn chỉnh.
- Theo dõi kỹ thuật xử lý hồ sơ mà không hiển thị nội dung CV hay điểm chuyên môn.
- Xem Extraction, Matching, Career Path và chạy lại case AI có thể retry.
- Thêm/sửa/ngưng sử dụng nhóm nghề, cấp bậc và năng lực.
- Chỉnh sửa thang năng lực 5 cấp độ với xem trước trực tiếp.
- Theo dõi Nhật ký hoạt động và Báo cáo trong 7/30 ngày.

Cuối sidebar có ba kịch bản **Chuẩn**, **Trống**, **Lỗi AI** và nút **Khôi phục dữ liệu** để chuẩn bị lại demo.

Đọc [STRUCTURE.md](STRUCTURE.md) trước khi mở rộng feature và [kế hoạch Admin Dashboard](../docs/admin_dashboard_plan.md) để xem phạm vi của từng phase.
