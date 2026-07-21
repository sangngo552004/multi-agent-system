# Kế hoạch phát triển Admin Dashboard bằng Next.js

> **Đầu vào:** [Phân tích Admin Dashboard MVP](admin_dashboard_design.md)  
> **Frontend hiện tại:** Next.js 16.2.10, React 19.2.4, TypeScript strict, Tailwind CSS 4  
> **Phạm vi:** Frontend demo dùng mock data, light mode, tối đa 5 phase  
> **Thời gian gợi ý:** 6–8 tuần cho một sinh viên làm chính

---

## 1. Mục tiêu của kế hoạch

Kế hoạch này triển khai năm chức năng P0 đã chốt:

1. Dashboard tổng quan.
2. Quản lý người dùng và xác minh HR.
3. Quản lý, duyệt và ẩn Job.
4. Theo dõi Application và quá trình AI.
5. Quản lý Job Family, Career Level và Competency.

Báo cáo, Learning Resources và trang lịch sử đầy đủ là P1, chỉ làm khi năm phần chính đã ổn định.

Kết quả cuối cần đạt:

- Có một Admin Dashboard nhìn hiện đại và có bản sắc riêng.
- Không phụ thuộc backend API.
- Mock data có thể tìm kiếm, lọc và thay đổi trạng thái thật trên giao diện.
- Cấu trúc code đủ rõ để sau này thay mock service bằng API.
- Các trang không bị dồn vào một vài file quá dài.
- Có một kịch bản demo xuyên suốt từ Dashboard đến xử lý AI và quản lý competency.

---

## 2. Hiện trạng và các quyết định nền tảng

### 2.1. Hiện trạng frontend

Frontend hiện chỉ là trang mặc định của Next.js. Những phần đã có:

- App Router trong `src/app`.
- TypeScript ở chế độ `strict`.
- Alias `@/* → src/*`.
- Tailwind CSS 4 được import trong `globals.css`.
- Font Geist và Geist Mono.
- Chưa có `node_modules` trong workspace hiện tại.
- Chưa có component library, state library hoặc chart library.

### 2.2. Quyết định chính

| Nội dung | Quyết định |
|---|---|
| Routing | Next.js App Router |
| Styling | Tailwind CSS 4 + CSS variables tự thiết kế |
| Theme | Chỉ light mode trong MVP |
| UI primitives | Radix Primitives, tự viết style |
| Async/mock state | TanStack Query + mock service |
| Data table | TanStack Table |
| Form | React Hook Form + Zod |
| Chart | Recharts, tùy biến màu và tooltip |
| Icons | Lucide React |
| Toast | Sonner |
| Backend | Chưa sử dụng; toàn bộ dữ liệu từ mock service |
| Template | Không sử dụng dashboard template có sẵn |

Không dùng `styled-components` vì dự án đã có Tailwind CSS 4. “Styled” trong kế hoạch này được thực hiện bằng design tokens, CSS variables và component styles riêng, tránh trộn hai hệ thống styling.

### 2.3. Vì sao không dùng giao diện shadcn/template mặc định?

Shadcn có thể giúp code nhanh, nhưng nếu giữ nguyên style mặc định thì Dashboard dễ giống nhiều sản phẩm AI-generated khác. Kế hoạch này chỉ sử dụng **Radix** làm lớp hành vi và accessibility cho dialog, dropdown, tabs, tooltip; phần hình ảnh sẽ tự xây hoàn toàn.

Những mẫu cần tránh:

- Bốn KPI card bằng nhau đặt thành một hàng rồi tới biểu đồ.
- Nền gradient tím/xanh, glassmorphism và shadow dày.
- Mọi card đều bo góc 16–24 px.
- Sidebar tối màu giống template SaaS phổ biến.
- Dùng icon trong ô vuông màu ở mọi vị trí.
- Quá nhiều badge màu và progress ring.
- Animation xuất hiện ở mọi thao tác.

---

## 3. Hướng thiết kế giao diện

### 3.1. Concept: “Editorial Operations Console”

Giao diện mang cảm giác một bàn điều hành có tổ chức, kết hợp:

- Bố cục editorial: tiêu đề rõ, khoảng trắng có chủ đích, một số khối bất đối xứng.
- Data-heavy nhưng không chật: bảng rõ, trạng thái dễ quét, chi tiết mở thành trang riêng.
- AI được thể hiện bằng pipeline, evidence và score breakdown thay vì hiệu ứng robot/gradient.
- Màu thương hiệu tiết chế, chỉ nhấn vào điểm cần chú ý.

Light mode không đồng nghĩa mọi vùng đều trắng hoàn toàn. Nền chính dùng màu trắng ấm rất nhẹ; các surface quan trọng dùng trắng tinh để tạo chiều sâu bằng border thay vì shadow.

### 3.2. Bảng màu dự kiến

| Token | Màu gợi ý | Cách dùng |
|---|---|---|
| Canvas | `#F6F7F3` | Nền toàn trang |
| Surface | `#FFFFFF` | Panel, table, dialog |
| Ink | `#16211B` | Text chính |
| Muted | `#667169` | Text phụ |
| Border | `#DCE3DD` | Đường phân cách |
| Brand | `#174D3C` | Navigation active, primary action |
| Accent | `#E76545` | Điểm cần chú ý, selected highlight |
| Signal | `#D8F05F` | Dùng rất ít cho AI/process highlight |
| Info | `#3768C5` | Đang xử lý/thông tin |
| Success | `#19845F` | Hoàn thành/đã duyệt |
| Warning | `#C68017` | Chờ/cần xem xét |
| Danger | `#C6473A` | Lỗi/khóa/ẩn |

Màu `Signal` không dùng làm text trên nền trắng và không dùng đại trà. Nó chỉ nên xuất hiện ở marker nhỏ, chart selection hoặc điểm nhấn AI.

### 3.3. Typography

- Font UI và tiêu đề: **Be Vietnam Pro** qua `next/font/google`, phù hợp nội dung tiếng Việt.
- Font mã/ID/score nhỏ: Geist Mono hiện có.
- Page title: 28–36 px tùy màn hình.
- Section title: 18–22 px.
- Body: 14–16 px.
- Table: 13–14 px, line-height đủ thoáng.
- Số liệu lớn dùng tabular numbers để không nhảy chiều rộng.

Không dùng quá nhiều font weight. Chủ yếu dùng 400, 500, 600 và 700 cho số liệu quan trọng.

### 3.4. Shape, border và shadow

- Border radius chính: 8–10 px.
- Input/button nhỏ: 6–8 px.
- Badge: pill vừa đủ cho status, không dùng pill cho mọi text.
- Border 1 px là cách phân lớp chính.
- Shadow chỉ dùng cho dialog, dropdown và panel nổi.
- Card thường không có shadow hoặc chỉ có shadow rất nhẹ.

### 3.5. Bố cục Admin Shell

- Sidebar rộng khoảng 232–248 px trên desktop.
- Top bar cao khoảng 64–72 px.
- Nội dung chính dùng grid 12 cột, max-width khoảng 1500–1600 px.
- Sidebar nền canvas/surface sáng; active item dùng mảng brand nhạt và vạch dọc màu brand.
- Mobile/tablet chuyển sidebar thành drawer.
- Các trang detail dùng breadcrumb + entity header + tabs.

### 3.6. Bố cục khác biệt cho Dashboard

Không dùng dãy KPI card giống nhau. Thay vào đó:

```text
┌ Header + khoảng thời gian ───────────────────────────────┐
│ Operational pulse: 5 số liệu trên một dải ngang         │
├────────────────────────────────┬─────────────────────────┤
│ Cần xử lý                      │ Tình trạng AI           │
│ Danh sách lớn, ưu tiên cao     │ Chart + completion rate │
├───────────────────────┬────────┴─────────────────────────┤
│ Application trend     │ Hoạt động gần đây               │
└───────────────────────┴──────────────────────────────────┘
```

Khối “Cần xử lý” là trung tâm thay vì biểu đồ. Điều này đúng với vai trò admin và tạo bố cục ít giống dashboard template.

### 3.7. Motion

- Transition 160–220 ms cho hover, dropdown, tab và drawer.
- Chart chỉ animate lần đầu tải.
- Retry AI có progress chuyển bước rõ, không dùng animation trang trí.
- Tôn trọng `prefers-reduced-motion`.
- Không thêm thư viện motion trong MVP; CSS transition là đủ.

---

## 4. Thư viện đề xuất

### 4.1. Thư viện runtime

| Thư viện | Mục đích | Lý do chọn |
|---|---|---|
| `radix-ui` | Dialog, dropdown, tabs, tooltip, select | Unstyled, accessible, tùy biến hoàn toàn |
| `lucide-react` | Icon | Nét gọn, tree-shake, đồng nhất |
| `@tanstack/react-query` | Loading, caching, mutation cho mock service | Sau này đổi sang API dễ hơn |
| `@tanstack/react-table` | Sort, filter, pagination, column definitions | Nhiều màn hình dùng bảng |
| `recharts` | Dashboard charts | Linh hoạt, đủ dùng cho MVP |
| `react-hook-form` | Quản lý form | Giảm re-render và code form |
| `zod` | Validation schema | TypeScript-friendly, dùng chung quy tắc form |
| `@hookform/resolvers` | Nối Zod với form | Tránh tự map validation |
| `sonner` | Toast | Nhẹ và dễ tùy biến |
| `clsx` | Ghép class có điều kiện | Component UI gọn hơn |
| `tailwind-merge` | Xử lý class Tailwind xung đột | Dùng trong hàm `cn()` |
| `date-fns` | Format ngày/giờ | Nhẹ và chỉ import hàm cần thiết |

### 4.2. Thư viện test — thêm ở Phase 5 nếu còn thời gian

| Thư viện | Mục đích |
|---|---|
| `vitest` | Unit test |
| `@testing-library/react` | Test component và tương tác |
| `@testing-library/jest-dom` | Assertion cho DOM |
| `jsdom` | Môi trường DOM cho Vitest |

### 4.3. Nguyên tắc cài đặt

- Chỉ cài ở Phase 1, không cài rải rác qua từng page.
- Chọn bản stable tại thời điểm triển khai; không dùng beta.
- Kiểm tra peer dependencies với React 19 trước khi commit.
- Commit `package.json` và `package-lock.json` cùng nhau.
- Không cài Redux/Zustand vì TanStack Query + local state đã đủ.
- Không cài animation, date picker hoặc chart library thứ hai nếu chưa có nhu cầu thật.

Lệnh dự kiến:

```bash
npm install radix-ui lucide-react @tanstack/react-query @tanstack/react-table recharts react-hook-form zod @hookform/resolvers sonner clsx tailwind-merge date-fns
```

Kế hoạch này chưa tự cài thư viện; việc cài đặt được thực hiện khi bắt đầu Phase 1.

---

## 5. Cấu trúc thư mục

### 5.1. Route structure

```text
src/app/
├── layout.tsx
├── page.tsx                         # Redirect/demo landing
├── providers.tsx                    # QueryClient, Tooltip, Toaster
└── (admin)/
    └── admin/
        ├── layout.tsx               # Admin shell
        ├── page.tsx                 # Redirect tới dashboard
        ├── loading.tsx
        ├── error.tsx
        ├── dashboard/
        │   └── page.tsx
        ├── users/
        │   ├── page.tsx
        │   └── [userId]/page.tsx
        ├── jobs/
        │   ├── page.tsx
        │   └── [jobId]/page.tsx
        ├── applications/
        │   ├── page.tsx
        │   └── [applicationId]/page.tsx
        ├── knowledge/
        │   ├── page.tsx             # Overview/tabs
        │   └── competencies/
        │       └── [competencyId]/page.tsx
        ├── reports/page.tsx         # P1
        └── activity/page.tsx        # P1
```

Route group `(admin)` giúp tổ chức code mà không xuất hiện trong URL. Các `page.tsx` chủ yếu chịu trách nhiệm ghép feature components và đọc params; không chứa toàn bộ table/form logic.

### 5.2. Source structure

```text
src/
├── components/
│   ├── ui/                           # Button, Input, Badge, Dialog...
│   ├── layout/                       # Sidebar, Topbar, PageHeader
│   └── data-display/                 # DataTable, EmptyState, Stat, ChartShell
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── dashboard.queries.ts
│   │   └── dashboard.types.ts
│   ├── users/
│   │   ├── components/
│   │   ├── users.queries.ts
│   │   ├── users.schema.ts
│   │   └── users.types.ts
│   ├── jobs/
│   ├── applications/
│   ├── knowledge/
│   └── activity/
├── mocks/
│   ├── data/                         # Seed arrays theo entity
│   ├── mock-database.ts              # Nguồn dữ liệu mutable duy nhất
│   ├── mock-admin.service.ts         # Promise API + delay
│   ├── mock-scenarios.ts             # normal/ai-error/empty
│   └── reset-demo.ts
├── services/
│   ├── admin.service.ts              # Interface/facade được feature gọi
│   └── query-keys.ts
├── config/
│   ├── navigation.ts
│   ├── status.ts
│   └── theme.ts
├── hooks/
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── lib/
│   ├── cn.ts
│   ├── format.ts
│   └── constants.ts
└── styles/
    └── tokens.css                    # Nếu globals.css bắt đầu dài
```

### 5.3. Quy tắc chia file

- `page.tsx`: mục tiêu dưới khoảng 100–120 dòng; chỉ orchestration.
- Component feature: nên dưới khoảng 180–220 dòng; nếu dài thì tách section, form hoặc column definitions.
- Column definition của bảng đặt file riêng khi trên 5–6 cột.
- Schema validation đặt cạnh feature, không đặt chung một file schema toàn dự án.
- `components/ui` không import types hoặc logic từ `features`.
- Business action như `approveJob`, `retryApplication` nằm ở service/query hooks, không nằm trong Button.
- Không tạo một file `types.ts` khổng lồ cho toàn bộ hệ thống.
- Chỉ thêm `"use client"` ở component có state/event/browser API; không biến toàn bộ layout thành client component nếu không cần.

---

## 6. Chiến lược mock data

### 6.1. Kiến trúc

```text
Page/Feature Component
→ TanStack Query hook
→ adminService facade
→ MockAdminService
→ MockDatabase + seed data
```

Khi có backend:

```text
adminService facade
→ HttpAdminService
→ Backend API
```

Component và query hook gần như không cần thay đổi.

### 6.2. MockDatabase

Một module duy nhất giữ dữ liệu mutable:

- Users.
- Jobs.
- Applications.
- Job Families.
- Career Levels.
- Competencies và levels.
- Activity entries.

Không để mỗi page giữ một bản sao dữ liệu riêng. Nếu Admin duyệt Job, Dashboard count, Job list, Job detail và Activity phải cùng thay đổi.

### 6.3. Hành vi giả lập

- Query delay cố định 250–600 ms để thấy skeleton.
- Mutation delay 400–800 ms để thấy pending state.
- Search/filter/pagination hoạt động trên seed data.
- Mutation cập nhật MockDatabase rồi invalidate query liên quan.
- Retry AI dùng chuỗi trạng thái xác định: `FAILED → WAITING → PROCESSING → COMPLETED`.
- Có một lỗi `INVALID_FILE` không retry được.
- Có nút `Reset demo data` chỉ hiện trong demo mode.
- Có ba scenario: `normal`, `ai-error`, `empty`.

Không dùng random failure vì có thể làm hỏng buổi trình bày.

### 6.4. Seed data

| Entity | Số lượng gợi ý |
|---|---:|
| Users | 18–24 |
| HR chờ xác minh | 2–3 |
| Jobs | 10–14 |
| Applications | 24–36 |
| AI failed | 2 |
| Job Families | 3–4 |
| Career Levels | 4–5 |
| Competencies | 12–18 |
| Activity entries | 15–25 |

Dữ liệu phải liên kết đúng ID; không dùng email, CV hoặc công ty thật.

### 6.5. Persistence

Mặc định seed lại khi refresh là đủ trong quá trình đầu. Khi demo đã ổn, có thể lưu trạng thái mock vào `localStorage` để refresh không mất thao tác. Dữ liệu lưu có `mockVersion`; nếu seed thay đổi thì tự reset để tránh lỗi cấu trúc cũ.

---

## 7. Tổng quan 5 phase

| Phase | Nội dung | Thời lượng gợi ý | Kết quả chính |
|---|---|---:|---|
| 1 | Foundation, design system, shell, mock core | 1–1.5 tuần | Khung UI và kiến trúc ổn định |
| 2 | Dashboard và User Management | 1–1.5 tuần | Luồng quản trị đầu tiên hoàn chỉnh |
| 3 | Job Management | 1 tuần | Duyệt/ẩn Job và xem matching config |
| 4 | Application & AI Monitoring | 1.5–2 tuần | Điểm nhấn Multi-Agent hoàn chỉnh |
| 5 | Knowledge Management, polish và P1 | 1.5–2 tuần | Competency editor và bản demo hoàn thiện |

Các phase được triển khai nối tiếp. Không bắt đầu màn hình P1 khi phase P0 trước đó chưa đạt exit criteria.

---

## 8. Phase 1 — Foundation, Visual System và Mock Core

### 8.1. Mục tiêu

Tạo nền móng để các phase sau chỉ tập trung vào nghiệp vụ, không phải liên tục sửa layout, màu, Button hoặc cách lấy dữ liệu.

### 8.2. Công việc

#### Thiết lập dự án

- Cài các thư viện runtime đã chọn.
- Cài `node_modules` và kiểm tra `npm run dev`.
- Đọc tài liệu Next.js cục bộ trong `node_modules/next/dist/docs/` đúng theo `frontend/AGENTS.md` trước khi code.
- Đổi metadata, `lang="vi"`, favicon/title cho Admin Demo.
- Xóa nội dung starter page và dark-mode media rule hiện tại.
- Tạo `providers.tsx` cho QueryClient, Radix Tooltip và Sonner.

#### Design tokens

- Khai báo palette, typography, spacing, radius, shadow trong `globals.css` hoặc `styles/tokens.css`.
- Thiết lập Be Vietnam Pro và Geist Mono.
- Viết utility `cn()` dùng `clsx + tailwind-merge`.
- Chốt status color map ở một file cấu hình.

#### Admin shell

- Sidebar desktop.
- Mobile sidebar drawer.
- Topbar, breadcrumb, avatar và badge DEMO.
- Page container/grid.
- Navigation active state.
- Placeholder routes cho năm module P0.

#### Component nền

- Button: primary, secondary, ghost, danger.
- Input, search input, textarea.
- Select, dropdown, tooltip.
- Badge/status dot.
- Dialog/confirm dialog.
- Tabs.
- Skeleton.
- Empty state và error state.
- Table shell, pagination.
- Toast.

#### Mock core

- Tạo types chính.
- Tạo seed users/jobs/applications/knowledge/activity.
- Tạo MockDatabase.
- Tạo `adminService` facade.
- Tạo QueryClient và query keys.
- Tạo delay, reset và scenario helpers.

### 8.3. Trang cần có

- `/admin` redirect tới `/admin/dashboard`.
- Admin shell hoạt động với các route placeholder.
- Có thể tạo một trang development-only `UI Preview` để xem token/component; không cần đưa vào menu production.

### 8.4. UI focus

Phase này quyết định chất lượng thị giác của toàn dự án. Không chuyển phase nếu:

- Màu/border/spacing còn thay đổi tùy tiện giữa component.
- Sidebar/topbar vẫn giống starter template.
- Button/input/dialog chưa có trạng thái hover, focus, disabled và loading.
- Bố cục chưa hoạt động ở 1024 px và mobile cơ bản.

### 8.5. Exit criteria

- `npm run lint` và `npm run build` thành công.
- Admin shell hoạt động trên desktop/tablet/mobile cơ bản.
- Các component nền có style nhất quán và keyboard focus rõ.
- Mock service trả được dữ liệu và mutation thử nghiệm.
- Không page nào import trực tiếp seed arrays.
- Light mode cố định; không còn style dark mode từ starter.

---

## 9. Phase 2 — Dashboard và User Management

### 9.1. Mục tiêu

Hoàn thành luồng quản trị đầu tiên và chứng minh mock state có thể cập nhật đồng bộ nhiều màn hình.

### 9.2. Dashboard

#### Components

- `DashboardHeader`: lời chào, ngày và bộ lọc 7/30 ngày.
- `OperationalPulse`: dải năm số liệu, không phải năm card tách rời.
- `AttentionQueue`: HR chờ xác minh, Job chờ duyệt, AI failed.
- `AiStatusPanel`: donut/bar chart hoàn thành/đang xử lý/lỗi.
- `ApplicationTrendChart`: số Application theo ngày.
- `RecentActivity`: lịch sử gần đây.

#### Hành vi

- Click số liệu/cảnh báo chuyển sang danh sách có filter phù hợp.
- Skeleton riêng theo từng khu vực.
- Scenario empty hiển thị empty state có nội dung hữu ích.
- Dashboard tự cập nhật sau mutation user/job/application.

### 9.3. User Management

#### Trang danh sách

- Search tên/email.
- Filter role, account status, HR verification.
- Table có sort và pagination.
- Status dùng dot + label; không lạm dụng badge pill.
- Row click mở detail.

#### Trang chi tiết

- Entity header: avatar initials, tên, role, status, ngày tạo.
- Tab Overview và Activity.
- HR verification panel với tên công ty, email, website, ghi chú.
- Summary số Job hoặc Application.

#### Actions

- Khóa/mở user bằng confirm dialog có reason.
- Verify/Request changes/Reject HR.
- Mutation pending state khóa nút để tránh click lặp.
- Thành công tạo activity entry và cập nhật Dashboard.

### 9.4. UI focus

- User list sử dụng typography và divider thay vì card cho từng user.
- Detail page dùng bố cục 8/4: nội dung chính và action/summary rail.
- Dialog không dùng style mặc định của Radix.
- Trạng thái HR dễ hiểu bằng ngôn ngữ tiếng Việt.

### 9.5. Exit criteria

- Dashboard có bố cục bất đối xứng và ít nhất hai chart/data visualization.
- Search/filter/sort/pagination User hoạt động.
- Khóa/mở và xác minh HR cập nhật list, detail, Dashboard và Activity.
- Không thể tự khóa Admin demo đang đăng nhập.
- Loading, empty, error và confirm state đã có.
- Responsive ở desktop và tablet.

---

## 10. Phase 3 — Job Management

### 10.1. Mục tiêu

Hoàn thành chức năng quản lý nội dung tuyển dụng, đồng thời tái sử dụng DataTable và Detail Layout từ Phase 2.

### 10.2. Trang danh sách Job

- Segmented filter: Pending, Published, Hidden, Closed.
- Search theo title/HR.
- Filter Job Family và Career Level.
- Các cột: Job, HR, family/level, application count, status, created date.
- Row pending có marker nhẹ để ưu tiên, không tô nền toàn hàng quá mạnh.
- Toolbar hiển thị số filter đang áp dụng.

### 10.3. Trang chi tiết Job

#### Nội dung chính

- Title, location, employment type.
- Description, requirements, benefits.
- Preview được style như Candidate nhìn thấy.

#### Matching panel

- Job Family và Career Level.
- Danh sách competencies.
- Required level, weight và mandatory marker.
- AI-readiness summary: đủ/thiếu cấu hình.

#### Summary rail

- HR tạo Job.
- Status và ngày hết hạn.
- Số Application.
- Số AI completed/failed.

### 10.4. Actions

- Approve: `PENDING → PUBLISHED`.
- Reject: giữ không công khai, reason bắt buộc.
- Hide: `PUBLISHED → HIDDEN`.
- Show again: `HIDDEN → PUBLISHED`.

Mutation phải cập nhật Dashboard và thêm Activity entry.

### 10.5. UI focus

- Job detail mang cảm giác editorial document, không chia mọi đoạn text vào card riêng.
- Matching config là một panel kỹ thuật có cấu trúc, dùng bar nhỏ cho weight nhưng không dùng chart lớn.
- Action bar sticky nhẹ ở cuối/đầu trang để admin không phải cuộn về đầu.
- Candidate preview dùng border và typography riêng, không iframe.

### 10.6. Exit criteria

- Tất cả bốn trạng thái Job có dữ liệu và filter.
- Admin xem được nội dung và matching config trên cùng trang.
- Job thiếu family/competency không thể approve trong UI.
- Approve/hide/show/reject hoạt động bằng mock state.
- Dashboard count và Activity cập nhật đúng.
- DataTable không chứa logic riêng của User hay Job trong component core.

---

## 11. Phase 4 — Application và AI Monitoring

### 11.1. Mục tiêu

Xây phần có giá trị trình diễn cao nhất: giúp Admin hiểu một CV đã đi qua các agent nào, kết quả ra sao và xử lý lỗi như thế nào.

### 11.2. Trang danh sách Application

- Search Candidate, Job hoặc Application ID.
- Filter recruitment status và AI status độc lập.
- Filter score band và ngày ứng tuyển.
- Hai cột status tách biệt rõ.
- Score hiển thị bằng số + thanh nhỏ, không dùng gauge vòng ở mọi row.
- Failed và Needs Review có marker ưu tiên.

### 11.3. Trang chi tiết Application

#### Header

- Application ID dùng Geist Mono.
- Candidate, Job, applied date.
- Recruitment status và AI status đặt cạnh nhau nhưng khác nhóm.
- Primary action chỉ xuất hiện khi phù hợp.

#### AI Process Rail

Thiết kế như một trace dọc hoặc ngang:

```text
Received CV
Extraction
Matching
Career Path
Completed
```

Mỗi bước có trạng thái, thời gian và thông báo ngắn. Không hiển thị log/stack trace.

#### Tab CV Extraction

- Personal summary đã rút gọn.
- Skills dạng grouped tags có giới hạn.
- Experience và Education theo timeline.
- Language, method, confidence và warnings.

#### Tab Matching

- Score tổng nổi bật nhưng không chiếm cả màn hình.
- Component score bars: hard skill, soft skill, experience.
- Matched skills và missing skills chia hai cột.
- Lý do/khuyến nghị AI.
- Disclaimer score.

#### Tab Career Path

- Growth areas.
- Timeline phases.
- Activities/checkpoints.
- Learning resources nếu seed có.
- Empty/not-applicable/error state riêng.

### 11.4. Retry AI

- Chỉ hiện khi `FAILED` và `canRetry=true`.
- Confirm dialog giải thích thao tác.
- Progress mô phỏng `WAITING → PROCESSING → COMPLETED`.
- Query tự refresh/invalidate theo bước.
- Một case `INVALID_FILE` hiển thị hướng dẫn upload lại và không có nút retry.
- Retry không thay đổi recruitment status.

### 11.5. UI focus

- AI dùng accent `Signal` rất ít ở process marker/selection.
- Pipeline là yếu tố nhận diện chính, không dùng hình robot hoặc sparkle icon quá nhiều.
- Evidence và missing skills dễ quét hơn văn bản AI dài.
- Career Path dùng timeline có nhịp độ, không là một danh sách card giống nhau.
- Số liệu và ID dùng tabular/mono để tạo cảm giác công cụ chuyên nghiệp.

### 11.6. Exit criteria

- Danh sách tách rõ recruitment status và AI status.
- Detail có đủ Extraction, Matching và Career Path.
- Pipeline hiển thị success, processing, failed và skipped/not-applicable.
- Retryable case chạy trọn luồng và cập nhật Dashboard/Activity.
- Invalid-file case không retry được.
- Không hiển thị raw CV, API key, prompt hoặc stack trace.
- Kịch bản demo AI chạy ổn định, không dùng random.

---

## 12. Phase 5 — Knowledge Management, Polish và phần P1

### 12.1. Mục tiêu

Hoàn thiện điểm nhấn dữ liệu năng lực, sau đó dành thời gian cho chất lượng UI, responsive và demo thay vì mở rộng thêm quá nhiều chức năng.

### 12.2. Knowledge Overview

- Ba tab: Job Families, Career Levels, Competencies.
- Summary nhỏ: số active, số đang dùng, competency thiếu level description.
- Search/filter theo từng tab.

### 12.3. Job Families và Career Levels

- List và form add/edit.
- Bật/tắt sử dụng.
- Career Level có `rankValue` và sắp xếp trực quan.
- Confirm khi tắt item đang được Job sử dụng.

### 12.4. Competencies

#### Danh sách

- Search, filter category/status.
- Usage count.
- Level completeness `5/5`, `3/5`.
- Add/edit/deactivate.

#### Detail và Level Editor

Thiết kế “Competency Ladder” thay vì năm input card giống nhau:

```text
Level 5 ─ Chuyên gia       [mô tả]
Level 4 ─ Thành thạo       [mô tả]
Level 3 ─ Độc lập          [mô tả]
Level 2 ─ Thực hành        [mô tả]
Level 1 ─ Cơ bản           [mô tả]
```

- Level rail ở trái, editor ở phải.
- Có completion indicator.
- Preview mô tả level khi HR chọn competency.
- Validation tên, category, description và level 1–5.

### 12.5. P1 — chỉ làm sau khi P0 hoàn tất

Thứ tự ưu tiên:

1. Activity page đầy đủ.
2. Reports cơ bản dùng lại chart components.
3. Learning Resources list/form.

Nếu còn dưới một tuần, chỉ làm Activity page vì dữ liệu đã được tạo từ các mutation trước. Không bắt đầu Learning Resources nếu có nguy cơ làm giảm chất lượng phần AI/Competency.

### 12.6. Polish

- Responsive toàn bộ route ở desktop, tablet và mobile cơ bản.
- Keyboard/focus cho dialog, tabs, dropdown, table action.
- Kiểm tra contrast và status không phụ thuộc chỉ vào màu.
- Loading, empty, no-result, error ở mọi màn hình P0.
- Tối ưu table/chart ở dữ liệu seed lớn nhất.
- Đồng bộ copy tiếng Việt.
- Tạo demo scenario switch và reset data.
- Rà soát file quá dài và tách component.
- Xóa code/component không dùng.

### 12.7. Verification

- `npm run lint`.
- `npm run build`.
- Component test cho status mapping, form validation và retry flow nếu đã thêm test stack.
- Smoke test bốn luồng: verify HR, approve Job, retry AI, edit competency levels.
- Chạy lại demo từ reset state ít nhất ba lần.

### 12.8. Exit criteria

- CRUD mock hoạt động cho Family, Career Level và Competency.
- Competency Ladder hoàn chỉnh và có bản sắc riêng.
- Không deactivate competency đang dùng mà thiếu confirm.
- Tất cả route P0 có responsive và state đầy đủ.
- Lint/build thành công.
- Demo 6–8 phút chạy ổn định từ reset state.
- P1 không làm ảnh hưởng chất lượng hoặc tiến độ P0.

---

## 13. Component inventory dự kiến

### UI primitives

```text
Button
IconButton
Input / SearchInput / Textarea
Select
Checkbox
Badge / StatusDot
Dialog / ConfirmDialog
DropdownMenu
Tabs
Tooltip
Toast
Skeleton
Pagination
```

### Shared composition

```text
AdminSidebar
AdminTopbar
PageHeader
EntityHeader
DataTable
FilterBar
EmptyState
ErrorState
MetricStrip
ChartPanel
ActivityFeed
DetailRail
```

### Feature components

```text
Dashboard: OperationalPulse, AttentionQueue, AiStatusChart
Users: UserTable, UserSummary, HrVerificationPanel
Jobs: JobTable, JobDocument, MatchingConfigPanel
Applications: ApplicationTable, AiProcessRail, MatchBreakdown, CareerPathTimeline
Knowledge: FamilyTable, CareerLevelTable, CompetencyTable, CompetencyLadder
```

Không tạo abstraction quá sớm. Chỉ chuyển component thành shared khi đã có ít nhất hai nơi dùng và API thực sự giống nhau.

---

## 14. Quy tắc đảm bảo UI không bị “AI-generated phổ thông”

### Nên làm

- Chọn một concept hình ảnh và bám đến cuối.
- Dùng một primary color, một accent và hệ màu trạng thái.
- Thiết kế layout theo ý nghĩa nội dung, không theo mẫu card grid.
- Đặt “Cần xử lý” ở trung tâm Dashboard.
- Dùng typography, divider và spacing để phân cấp.
- Tạo hai visual riêng: AI Process Rail và Competency Ladder.
- Viết copy tiếng Việt tự nhiên, ngắn và nhất quán.
- Dùng icon như hỗ trợ, không thay thế label.

### Không nên làm

- Copy nguyên component styling từ shadcn hoặc template.
- Thêm gradient/glow/sparkle để biểu diễn AI.
- Bo tròn và shadow mọi panel.
- Dùng lorem ipsum hoặc tên công ty thật trong mock.
- Nhồi chart chỉ để trang trông “nhiều dữ liệu”.
- Dùng quá năm màu trên một màn hình.
- Mỗi page tự đặt padding, radius và font size khác nhau.

### Checklist review UI cuối mỗi phase

- Trang có một visual hierarchy rõ không?
- Hành động chính có nổi bật nhưng không lấn át không?
- Có khối nào chỉ tồn tại để lấp chỗ trống không?
- Có thể bỏ card/border nào mà bố cục vẫn rõ không?
- Trạng thái có đọc được khi không phân biệt màu không?
- Page có giống một template SaaS phổ biến không? Nếu có, đổi composition chứ không chỉ đổi màu.

---

## 15. Responsive strategy

| Kích thước | Hành vi |
|---|---|
| `≥ 1280px` | Sidebar cố định, grid 12 cột, detail 8/4 |
| `1024–1279px` | Sidebar thu gọn tùy chọn, grid đơn giản hơn |
| `768–1023px` | Sidebar drawer, chart xếp 1 cột, table scroll ngang |
| `< 768px` | Cards/list thay một số table, action bar sticky, tabs scroll |

Admin Dashboard ưu tiên desktop. Mobile cần xem và thực hiện action cơ bản, không cần tối ưu form Competency Level phức tạp bằng desktop.

---

## 16. Rủi ro và phương án giảm scope

| Rủi ro | Cách xử lý |
|---|---|
| Mất nhiều thời gian làm design system | Chốt token/component ở Phase 1, không đổi concept giữa chừng |
| DataTable quá phức tạp | Chỉ làm search/filter/sort/pagination; bỏ column resize/pinning |
| Mock state không đồng bộ | Một MockDatabase, mutation luôn invalidate query |
| Retry AI khó mô phỏng | Dùng state machine và timer cố định, không realtime thật |
| Quá nhiều thư viện | Chỉ cài danh sách đã chốt; test stack để Phase 5 |
| Component file quá dài | Tách table columns, form sections và detail panels theo feature |
| P1 làm trễ P0 | Cắt Reports, Resources rồi Activity theo thứ tự đó |
| UI giống template | Review bằng checklist mục 14 sau mỗi phase |
| Build lỗi do phiên bản mới | Chỉ dùng stable, kiểm peer dependency và build ngay Phase 1 |

### Cut line nếu thiếu thời gian

Phải giữ:

- Admin shell và design system.
- Dashboard action queue.
- User verification/block.
- Job approve/hide.
- Application detail, AI rail và retry.
- Competency list + level editor.

Có thể bỏ:

- Reports.
- Learning Resources.
- Activity page riêng; chỉ giữ activity widget.
- Mobile form đầy đủ.
- Persist mock state sau refresh.
- Component tests nếu lint/build và smoke test đã chắc chắn.

---

## 17. Kịch bản demo dùng để kiểm tra tiến độ

Mỗi phase phải đóng góp vào kịch bản cuối:

1. Mở Dashboard, thấy hai việc cần xử lý và một AI error.
2. Mở HR pending, kiểm tra thông tin và xác minh.
3. Mở Job pending, xem matching config và approve.
4. Mở Application failed, xem AI Process Rail và retry.
5. Sau khi completed, xem Extraction, Matching và Career Path.
6. Mở competency Docker, hoàn thiện Level 3 rồi lưu.
7. Quay lại Dashboard/Activity để thấy các thay đổi.

Nếu một tính năng không hỗ trợ kịch bản này hoặc không thuộc P0, cần cân nhắc hoãn.

---

## 18. Definition of Done toàn kế hoạch

- Hoàn thành năm phase hoặc hoàn thành toàn bộ P0 trước khi cắt P1.
- UI light mode có palette, typography và bố cục nhất quán.
- Không dùng template có sẵn hoặc style mặc định của component library.
- AI Process Rail và Competency Ladder tạo được điểm nhận diện riêng.
- Route/file structure đúng App Router và không có page/component khổng lồ.
- Mock data thông qua service, không import trực tiếp vào page.
- Mutation cập nhật đồng bộ Dashboard, list, detail và Activity.
- Search/filter/pagination hoạt động ở các bảng chính.
- Loading, empty, error, confirm và success state hoàn chỉnh.
- Responsive tốt trên desktop/tablet, mobile dùng được ở mức cơ bản.
- Không chứa dữ liệu cá nhân thật, raw CV, secret hoặc stack trace.
- `npm run lint` và `npm run build` thành công.
- Reset demo và kịch bản 6–8 phút chạy ổn định.

---

## 19. Tài liệu kỹ thuật tham khảo

- [Next.js App Router và project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Tailwind CSS 4 và CSS-first theme variables](https://tailwindcss.com/blog/tailwindcss-v4)
- [Radix Primitives — unstyled accessible components](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [TanStack Query React](https://tanstack.com/query/latest/docs/framework/react/installation)
- [TanStack Table React](https://tanstack.com/table/latest/docs/framework/react/react-table)
- [Recharts](https://recharts.github.io/en-US/guide/getting-started/)
- [Zod](https://zod.dev/)
- [Lucide React](https://lucide.dev/guide/react)
- [Sonner](https://sonner.emilkowal.ski/getting-started)

Khi bắt đầu code, ưu tiên tài liệu trong `frontend/node_modules/next/dist/docs/` vì repository đang dùng Next.js 16 và `frontend/AGENTS.md` yêu cầu đọc đúng tài liệu đi kèm phiên bản.

