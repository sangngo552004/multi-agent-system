import { History } from "lucide-react";
import { recruitmentStatusMap } from "@/config/status";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import { formatDate } from "@/lib/format";

export function ApplicationTimeline({ application }: { application: HrApplicationDetail }) {
  return <section className="rounded-[12px] border border-border bg-surface p-5"><div className="flex items-center gap-2"><History className="size-4 text-brand" /><h2 className="text-base font-semibold text-ink">Lịch sử xử lý</h2></div><div className="mt-5 space-y-0">{application.histories.map((entry, index) => <article key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">{index < application.histories.length - 1 ? <span className="absolute bottom-0 left-[5px] top-3 w-px bg-border" /> : null}<span className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-surface bg-brand" /><div><p className="text-sm text-ink">{entry.fromStatus ? <>Chuyển từ <strong>{recruitmentStatusMap[entry.fromStatus].label}</strong> sang </> : <>Đã tiếp nhận ở trạng thái </>}<strong>{recruitmentStatusMap[entry.toStatus].label}</strong></p>{entry.reason ? <p className="mt-1 text-xs text-muted">Lý do: {entry.reason}</p> : null}<p className="mt-1 text-[11px] text-faint">{entry.actorName} · {formatDate(entry.createdAt, "dd/MM/yyyy · HH:mm")}</p></div></article>)}</div></section>;
}
