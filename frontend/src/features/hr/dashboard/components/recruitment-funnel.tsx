import type { HrFunnelDatum } from "@/features/hr/dashboard/dashboard.types";
import Link from "next/link";

export function RecruitmentFunnel({ data }: { data: HrFunnelDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#23473a] bg-[#13291f] p-5 text-white" aria-labelledby="funnel-title">
      <div className="flex items-start justify-between"><div><p className="admin-kicker text-[#a5b6ac]">Dòng ứng viên</p><h2 id="funnel-title" className="mt-1 text-lg font-semibold tracking-[-0.02em]">Phễu tuyển dụng</h2></div><span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-[#b8c7be]">{total} hồ sơ</span></div>
      <div className="mt-6 space-y-4">
        {data.map((item) => <Link href={`/hr/applications?status=${item.status}`} key={item.status} className="block rounded-[8px] p-1 transition-colors hover:bg-white/[0.04]"><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-[#b8c7be]">{item.label}</span><strong className="tabular-nums">{item.value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-[width]" style={{ width: `${Math.max(item.value ? 8 : 0, (item.value / max) * 100)}%`, backgroundColor: item.color }} /></div></Link>)}
      </div>
      <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-[#91a398]">Trạng thái do HR quyết định; AI không tự di chuyển ứng viên trong phễu.</p>
    </section>
  );
}
