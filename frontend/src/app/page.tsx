import Link from "next/link";

const portals = [
  {
    href: "/candidate/dashboard",
    title: "Ứng viên",
    description: "Tìm việc, quản lý hồ sơ và lộ trình nghề nghiệp.",
  },
  {
    href: "/hr/dashboard",
    title: "HR / Nhà tuyển dụng",
    description: "Quản lý việc làm và quy trình tuyển dụng.",
  },
  {
    href: "/admin/dashboard",
    title: "Quản trị viên",
    description: "Quản lý nền tảng, dữ liệu và hoạt động AI.",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <header className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          Project scaffold
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Multi-Agent Career Platform
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          Đây là trang điều hướng tạm thời. Các portal mới chỉ được khởi tạo cấu
          trúc và chưa triển khai chức năng.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Portal routes">
        {portals.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400"
          >
            <h2 className="font-medium text-zinc-950">{portal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {portal.description}
            </p>
            <span className="mt-5 block font-mono text-xs text-zinc-500">
              {portal.href}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
