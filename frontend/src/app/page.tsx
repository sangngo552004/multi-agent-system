import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const portals = [
  { href: "/candidate/dashboard", title: "Ứng viên", description: "Tìm việc, quản lý hồ sơ và xây dựng lộ trình nghề nghiệp.", tag: "Scaffold" },
  { href: "/hr/dashboard", title: "HR / Nhà tuyển dụng", description: "Quản lý tin tuyển dụng và quy trình chọn ứng viên.", tag: "Scaffold" },
  { href: "/admin/dashboard", title: "Quản trị viên", description: "Theo dõi vận hành, kiểm duyệt dữ liệu và giám sát quy trình AI.", tag: "Phase 1–5" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">Multi-Agent Career Platform</p>
        <h1 className="text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">Chọn không gian làm việc.</h1>
        <p className="text-sm leading-6 text-muted">Bản demo dùng chung cho ba vai trò. Không gian quản trị đã hoàn thiện năm giai đoạn với dữ liệu mô phỏng và các luồng quản lý chính.</p>
      </header>
      <section className="grid overflow-hidden rounded-[14px] border border-border bg-surface md:grid-cols-3" aria-label="Các không gian làm việc">
        {portals.map((portal) => (
          <Link key={portal.href} href={portal.href} className="group min-h-64 border-b border-border p-6 transition-colors hover:bg-[#fafbf8] md:border-b-0 md:border-r md:last:border-r-0">
            <div className="flex items-center justify-between"><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">{portal.tag}</span><ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-brand" /></div>
            <h2 className="mt-14 text-lg font-semibold tracking-[-0.02em] text-ink">{portal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{portal.description}</p>
            <span className="mt-6 block text-[10px] font-medium text-faint">{portal.href}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
