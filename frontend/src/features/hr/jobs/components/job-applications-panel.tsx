"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusDot } from "@/components/ui/status-dot";
import { recruitmentStatusMap } from "@/config/status";
import { BatchEmailModal } from "@/features/hr/applications/components/batch-email-modal";
import { useHrApplications, useRetryCareerPath } from "@/features/hr/applications/applications.queries";
import type { HrJobDetail } from "../jobs.types";

const PAGE_SIZE = 10;

function canSendEmail(item: { recruitmentStatus: unknown; careerPathReady?: boolean; careerPathNotApplicable?: boolean }) {
  const recruitmentStatus = String(item.recruitmentStatus);
  return recruitmentStatus === "SHORTLISTED" || (recruitmentStatus === "REJECTED" && (item.careerPathReady || item.careerPathNotApplicable));
}

function careerPathLabel(item: { recruitmentStatus: unknown; careerPathReady?: boolean; careerPathNotApplicable?: boolean; aiStatus: unknown }) {
  if (String(item.recruitmentStatus) !== "REJECTED") return { label: "—", className: "text-muted" };
  if (item.careerPathReady) return { label: "Sẵn sàng gửi", className: "text-success" };
  if (item.careerPathNotApplicable) return { label: "Không cần lộ trình", className: "text-info" };
  if (String(item.aiStatus) === "FAILED") return { label: "AI không thể tạo", className: "text-danger" };
  if (["WAITING", "PROCESSING"].includes(String(item.aiStatus))) return { label: "Đang tạo Career Path", className: "text-warning" };
  return { label: "Chưa có Career Path", className: "text-muted" };
}

export function JobApplicationsPanel({ job }: { job: HrJobDetail }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectGroupDialogOpen, setRejectGroupDialogOpen] = useState(false);
  const applications = useHrApplications({ jobId: job.id });
  const retryCareerPath = useRetryCareerPath();
  const filtered = useMemo(() => (applications.data ?? []).filter((item) => {
    const haystack = `${item.candidateName} ${item.candidateEmail}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (status === "ALL" || String(item.recruitmentStatus) === status);
  }), [applications.data, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selectedItems = (applications.data ?? []).filter((item) => selected.includes(item.id));
  const selectedStatuses = new Set(selectedItems.map((item) => String(item.recruitmentStatus)));
  const selectedCareerPathModes = new Set(selectedItems.filter((item) => String(item.recruitmentStatus) === "REJECTED").map((item) => item.careerPathReady ? "WITH_PATH" : item.careerPathNotApplicable ? "WITHOUT_PATH" : "INELIGIBLE"));
  const emailAction = selectedStatuses.size === 1 && selectedStatuses.has("SHORTLISTED") ? "INVITE" : selectedStatuses.size === 1 && selectedStatuses.has("REJECTED") && selectedCareerPathModes.size === 1 && !selectedCareerPathModes.has("INELIGIBLE") ? "REJECT" : null;
  const includeCareerPath = selectedCareerPathModes.has("WITH_PATH");
  const selectableIds = items.filter(canSendEmail).map((item) => item.id);
  const rejectedWithCareerPathCount = (applications.data ?? []).filter((item) => String(item.recruitmentStatus) === "REJECTED" && item.careerPathReady).length;
  const rejectedWithoutCareerPathCount = (applications.data ?? []).filter((item) => String(item.recruitmentStatus) === "REJECTED" && item.careerPathNotApplicable).length;
  const rejectedWaitingCareerPathCount = (applications.data ?? []).filter((item) => String(item.recruitmentStatus) === "REJECTED" && !item.careerPathReady && !item.careerPathNotApplicable && ["WAITING", "PROCESSING"].includes(String(item.aiStatus))).length;

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const togglePage = () => setSelected((current) => selectableIds.every((id) => current.includes(id)) ? current.filter((id) => !selectableIds.includes(id)) : [...new Set([...current, ...selectableIds])]);
  const selectStatus = (target: "SHORTLISTED" | "REJECTED") => setSelected((applications.data ?? []).filter((item) => String(item.recruitmentStatus) === target && canSendEmail(item)).map((item) => item.id));
  const selectRejectedGroup = (withCareerPath: boolean) => setSelected((applications.data ?? []).filter((item) => String(item.recruitmentStatus) === "REJECTED" && (withCareerPath ? item.careerPathReady : item.careerPathNotApplicable)).map((item) => item.id));

  return <section className="overflow-hidden rounded-[12px] border border-border bg-surface"><header className="border-b border-border p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="admin-kicker text-muted">Quy trình tuyển dụng</p><h2 className="mt-1 text-lg font-semibold text-ink">Ứng viên của vị trí</h2><p className="mt-1 text-xs text-muted">Chọn nhóm gửi thư; hệ thống sẽ dùng đúng nội dung cho từng loại hồ sơ.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => selectStatus("SHORTLISTED")}>Chọn tất cả đã duyệt</Button><Button size="sm" onClick={() => setRejectGroupDialogOpen(true)}>Gửi mail từ chối</Button></div></div><div className="mt-4 flex gap-2 overflow-x-auto"><div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="pl-9" placeholder="Tìm tên hoặc email..." /></div><Select label="Trạng thái" value={status} onValueChange={(value) => { setStatus(value); setPage(0); }} options={[{ value: "ALL", label: "Tất cả trạng thái" }, { value: "PENDING", label: "Mới nhận" }, { value: "SHORTLISTED", label: "Đã duyệt" }, { value: "REJECTED", label: "Đã từ chối" }, { value: "INVITED", label: "Đã gửi thư mời" }, { value: "REJECTED_FINAL", label: "Đã gửi thư từ chối" }]} /></div></header>
    <Dialog open={rejectGroupDialogOpen} onOpenChange={setRejectGroupDialogOpen}><DialogContent title="Chọn nhóm gửi thư từ chối" description="Hai nhóm sử dụng nội dung mail khác nhau để đảm bảo thông tin phù hợp với từng ứng viên."><div className="mt-5 space-y-3"><button type="button" disabled={!rejectedWithCareerPathCount} onClick={() => { selectRejectedGroup(true); setRejectGroupDialogOpen(false); }} className="w-full rounded-lg border border-border p-4 text-left transition hover:border-brand hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"><p className="font-semibold text-ink">Gửi thư kèm Career Path ({rejectedWithCareerPathCount})</p><p className="mt-1 text-xs leading-5 text-muted">Mỗi ứng viên sẽ nhận lộ trình phát triển riêng do AI tạo ở cuối thư.</p></button><button type="button" disabled={!rejectedWithoutCareerPathCount} onClick={() => { selectRejectedGroup(false); setRejectGroupDialogOpen(false); }} className="w-full rounded-lg border border-border p-4 text-left transition hover:border-brand hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"><p className="font-semibold text-ink">Gửi thư từ chối tiêu chuẩn ({rejectedWithoutCareerPathCount})</p><p className="mt-1 text-xs leading-5 text-muted">Dành cho hồ sơ không có khoảng trống phát triển cần gợi ý; thư sẽ không kèm Career Path.</p></button>{rejectedWaitingCareerPathCount ? <p className="rounded-lg bg-warning/10 p-3 text-xs leading-5 text-warning">{rejectedWaitingCareerPathCount} hồ sơ đang chờ AI tạo Career Path nên chưa thể gửi trong hai nhóm trên.</p> : null}</div></DialogContent></Dialog>
    {selected.length ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-soft px-5 py-3"><p className="text-sm text-ink"><strong>{selected.length}</strong> ứng viên đã chọn</p>{emailAction ? <BatchEmailModal applicationIds={selected} action={emailAction} includeCareerPath={includeCareerPath} jobId={job.id} /> : <p className="text-xs text-warning">Không thể gửi chung thư mời và thư từ chối, hoặc thư từ chối có và không có Career Path. Hãy gửi từng nhóm riêng.</p>}</div> : null}
    <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-surface-hover text-xs text-muted"><tr><th className="w-12 px-5 py-3"><input aria-label="Chọn ứng viên trong trang" type="checkbox" checked={selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id))} onChange={togglePage} /></th><th className="px-3 py-3 font-medium">Ứng viên</th><th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 font-medium">Career Path</th><th className="px-3 py-3 font-medium">Điểm khớp</th><th className="px-5 py-3 text-right font-medium">Chi tiết</th></tr></thead><tbody>{applications.isPending ? <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Đang tải ứng viên…</td></tr> : items.map((item) => { const rawStatus = String(item.recruitmentStatus); const canSelect = canSendEmail(item); const careerPath = careerPathLabel(item); const canRetry = rawStatus === "REJECTED" && !item.careerPathReady && !item.careerPathNotApplicable && !["WAITING", "PROCESSING"].includes(String(item.aiStatus)); const state = recruitmentStatusMap[rawStatus as keyof typeof recruitmentStatusMap] ?? recruitmentStatusMap.PENDING; return <tr key={item.id} className="border-t border-border"><td className="px-5 py-4"><input aria-label={`Chọn ${item.candidateName}`} type="checkbox" disabled={!canSelect} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /></td><td className="px-3 py-4"><p className="font-medium text-ink">{item.candidateName}</p><p className="mt-0.5 text-xs text-muted">{item.candidateEmail}</p></td><td className="px-3 py-4"><StatusDot label={state.label} tone={state.tone} className="text-xs" /></td><td className={`px-3 py-4 text-xs font-medium ${careerPath.className}`}><div className="flex items-center gap-2">{careerPath.label}{canRetry ? <Button variant="ghost" size="sm" loading={retryCareerPath.isPending} onClick={() => retryCareerPath.mutate(item.id, { onSuccess: () => toast.success("Đã tạo lại tác vụ Career Path."), onError: () => toast.error("Không thể tạo lại Career Path.") })}><RotateCcw className="mr-1 size-3" />Tạo lại</Button> : null}</div></td><td className="px-3 py-4 font-medium text-ink">{item.matchScore == null ? "—" : `${item.matchScore}/100`}</td><td className="px-5 py-4 text-right"><Link className="text-xs font-semibold text-brand hover:underline" href={`/hr/applications/${item.id}`}>Xem hồ sơ</Link></td></tr>; })}{!applications.isPending && !items.length ? <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Không có ứng viên phù hợp.</td></tr> : null}</tbody></table></div>
    <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted"><span>{filtered.length} ứng viên</span><div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" /></Button><span>Trang {page + 1}/{pageCount}</span><Button variant="ghost" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight className="size-4" /></Button></div></footer>
  </section>;
}
