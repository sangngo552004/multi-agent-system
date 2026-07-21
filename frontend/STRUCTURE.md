# Frontend Structure and Ownership

## 1. Mục tiêu

Cấu trúc này cho phép các thành viên phát triển song song ba portal mà hạn chế sửa cùng file:

| Portal | Route ownership | Feature ownership |
|---|---|---|
| Candidate | `src/app/(candidate)/candidate/**` | `src/features/candidate/**` |
| HR | `src/app/(hr)/hr/**` | `src/features/hr/**` |
| Admin | `src/app/(admin)/admin/**` | `src/features/admin/**` |
| Auth | `src/app/(auth)/**` | `src/features/auth/**` |

Route groups trong dấu ngoặc chỉ dùng tổ chức code và không xuất hiện trong URL.

## 2. Cấu trúc tổng quát

```text
src/
├── app/                         # Chỉ routing, layouts, route-level states
│   ├── (auth)/
│   ├── (candidate)/candidate/
│   ├── (hr)/hr/
│   └── (admin)/admin/
├── components/
│   ├── ui/                      # Primitive không chứa nghiệp vụ
│   ├── layout/                  # Shell/navigation dùng chung
│   ├── data-display/            # Table, chart shell, empty state
│   └── scaffold/                # Placeholder tạm thời
├── features/
│   ├── auth/
│   ├── candidate/
│   ├── hr/
│   ├── admin/
│   └── shared/
├── config/                      # Navigation, status maps, public config
├── hooks/                       # Hook thực sự dùng chung
├── lib/                         # Pure utilities
├── mocks/                       # Seed/scenario/mock database
├── services/                    # Contracts và data-source adapters
├── styles/                      # Tokens hoặc stylesheet dùng chung
└── types/                       # Shared domain types thật sự dùng nhiều portal
```

## 3. Cấu trúc một feature

Chỉ tạo thư mục con khi có file thực tế. Mẫu đề xuất:

```text
features/admin/users/
├── components/
├── hooks/
├── users.queries.ts
├── users.schema.ts
└── users.types.ts
```

- `page.tsx` ghép feature components, không chứa toàn bộ logic.
- Component chỉ dùng trong một feature nằm trong feature đó.
- Component dùng từ hai feature trở lên mới cân nhắc chuyển sang `components/`.
- Validation schema và types thuộc feature được đặt cạnh feature.
- Không tạo barrel `index.ts` hàng loạt nếu chưa đem lại giá trị.

## 4. Quy tắc import

Chiều phụ thuộc mong muốn:

```text
app → features → components/services/config/hooks/lib/types
features → components/services/config/hooks/lib/types
components/ui → lib/types cơ bản
```

Không cho phép:

- `components/ui` import từ `features`.
- Admin feature import trực tiếp component nội bộ của HR/Candidate và ngược lại.
- Page import trực tiếp seed arrays trong `mocks/data`.
- Client component import code có secret hoặc server-only dependency.

Nếu hai portal dùng chung một domain concept, chia sẻ type/service contract; không mặc định chia sẻ toàn bộ UI vì trải nghiệm theo vai trò có thể khác nhau.

## 5. Điểm nóng cần phối hợp trước khi sửa

Những file/thư mục dễ gây merge conflict:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/providers.tsx` khi được tạo
- `package.json` và `package-lock.json`
- `src/components/ui/**`
- `src/config/**`
- `src/types/**`

Thành viên cần thông báo nhóm trước khi thay đổi các điểm trên. Các thay đổi chỉ thuộc một portal nên giới hạn trong route group và feature ownership của portal đó.

## 6. Route và placeholder

Các route Admin đã dùng page composition từ feature tương ứng. `RouteScaffold` hiện chỉ còn là placeholder cho các route HR và Candidate chưa triển khai.

Khi bắt đầu feature:

1. Giữ route file ngắn.
2. Thay `RouteScaffold` bằng page composition từ feature tương ứng.
3. Không thêm nghiệp vụ vào `RouteScaffold`.
4. Xóa toàn bộ `components/scaffold` khi không route nào còn dùng.

## 7. Server và Client Components

- Mặc định page/layout là Server Component.
- Chỉ thêm `"use client"` vào component cần state, event handler, context hoặc browser API.
- Giữ client boundary càng gần phần tương tác càng tốt.
- Provider của thư viện client đặt trong một component `providers.tsx`, không biến root layout thành client component.

## 8. Mock và API sau này

Luồng dữ liệu dự kiến:

```text
Feature query/hook → service contract → mock adapter
                                  ↘ future HTTP adapter
```

Mock data phải có một nguồn mutable duy nhất. Mutation phải cập nhật các màn hình liên quan, không sao chép dữ liệu riêng cho từng page.

## 9. Trạng thái phát triển

Admin Phase 1–5 đã hoàn thành: design system, responsive shell, mock database/service, Dashboard, User Management, Job Management, Application/AI Monitoring, Knowledge Management, Activity và Reports cơ bản.

Những phần chưa triển khai:

- Authentication và route guard.
- Feature thực tế cho HR và Candidate.
- HTTP adapter kết nối backend.
- Automated test framework; hiện dự án được kiểm tra bằng lint, production build và demo flow.
