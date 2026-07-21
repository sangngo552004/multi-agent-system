# Multi-Agent Career Platform — Frontend

Frontend dùng Next.js App Router cho ba khu vực người dùng:

- Candidate: `/candidate/*`
- HR/Nhà tuyển dụng: `/hr/*`
- Admin: `/admin/*`

Hiện tại repository mới ở trạng thái **project scaffold**. Các route chỉ hiển thị placeholder; chưa có feature phase, design system, mock data hay API integration.

## Chạy dự án

```bash
npm ci
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra

```bash
npm run lint
npm run build
```

## Quy ước phát triển

Đọc [STRUCTURE.md](STRUCTURE.md) trước khi thêm route hoặc feature mới. Các hướng dẫn Next.js riêng của repository nằm trong [AGENTS.md](AGENTS.md).

Các thư viện và design system dự kiến cho Admin được mô tả ở [kế hoạch Admin Dashboard](../docs/admin_dashboard_plan.md), nhưng chưa được cài trong bước scaffold này.
