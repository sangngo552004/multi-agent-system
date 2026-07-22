"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ShieldCheck, Tags, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useHrCatalogOptions } from "@/features/hr/jobs/jobs.queries";
import { TalentPoolCard } from "@/features/hr/talent-pool/components/talent-pool-card";
import { TalentPoolSkeleton } from "@/features/hr/talent-pool/components/talent-pool-skeleton";
import { useTalentPool } from "@/features/hr/talent-pool/talent-pool.queries";
import { useDebounce } from "@/hooks/use-debounce";

export function HrTalentPoolPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [jobFamilyId, setJobFamilyId] = useState(params.get("family") ?? "ALL");
  const [careerLevelId, setCareerLevelId] = useState(params.get("level") ?? "ALL");
  const [label, setLabel] = useState(params.get("label") ?? "ALL");
  const [openedAt] = useState(() => Date.now());
  const debouncedSearch = useDebounce(search, 300);
  const filters = useMemo(() => ({ search: debouncedSearch, jobFamilyId, careerLevelId, label }), [careerLevelId, debouncedSearch, jobFamilyId, label]);
  const query = useTalentPool(filters);
  const allEntries = useTalentPool({});
  const catalog = useHrCatalogOptions();
  const labels = [...new Set((allEntries.data ?? []).flatMap((entry) => entry.labels))].sort();

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set("search", debouncedSearch);
    if (jobFamilyId !== "ALL") next.set("family", jobFamilyId);
    if (careerLevelId !== "ALL") next.set("level", careerLevelId);
    if (label !== "ALL") next.set("label", label);
    router.replace(next.size ? `/hr/talent-pool?${next}` : "/hr/talent-pool", { scroll: false });
  }, [careerLevelId, debouncedSearch, jobFamilyId, label, router]);

  const entries = query.data ?? [];
  const all = allEntries.data ?? [];
  const expiring = all.filter((entry) => !entry.expired && new Date(entry.retentionUntil).getTime() - openedAt <= 30 * 86_400_000).length;
  const families = new Set(all.map((entry) => entry.jobFamilyId).filter(Boolean)).size;
  const clear = () => { setSearch(""); setJobFamilyId("ALL"); setCareerLevelId("ALL"); setLabel("ALL"); };

  return <div className="space-y-7"><PageHeader eyebrow="Nguồn ứng viên nội bộ" title="Kho ứng viên tiềm năng" description="Lưu những hồ sơ đã được ứng viên đồng ý để dễ tìm lại cho nhu cầu tuyển dụng sau." /><div className="grid gap-px overflow-hidden rounded-[12px] border border-border bg-border sm:grid-cols-3"><Summary icon={<UsersRound className="size-5" />} label="Ứng viên đang lưu" value={all.length} /><Summary icon={<Tags className="size-5" />} label="Nhóm nghề" value={families} /><Summary icon={<CalendarClock className="size-5" />} label="Sắp hết hạn lưu" value={expiring} note="Trong 30 ngày tới" /></div><section className="rounded-[12px] border border-border bg-surface p-4 sm:p-5"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, email hoặc kỹ năng..." className="w-full xl:max-w-sm" /><div className="flex flex-wrap gap-2"><Select label="Nhóm nghề" value={jobFamilyId} onValueChange={setJobFamilyId} options={[{ value: "ALL", label: "Tất cả nhóm nghề" }, ...(catalog.data?.jobFamilies.map((item) => ({ value: item.id, label: item.name })) ?? [])]} /><Select label="Cấp bậc" value={careerLevelId} onValueChange={setCareerLevelId} options={[{ value: "ALL", label: "Tất cả cấp bậc" }, ...(catalog.data?.careerLevels.map((item) => ({ value: item.id, label: item.name })) ?? [])]} /><Select label="Nhãn" value={label} onValueChange={setLabel} options={[{ value: "ALL", label: "Tất cả nhãn" }, ...labels.map((item) => ({ value: item, label: item }))]} /><button type="button" className="cursor-pointer px-2 text-xs font-semibold text-brand hover:underline" onClick={clear}>Xóa bộ lọc</button></div></div></section>{query.isPending ? <TalentPoolSkeleton /> : null}{query.isError ? <ErrorState title="Không thể tải kho ứng viên" description={query.error.message} onRetry={() => query.refetch()} /> : null}{query.data && entries.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <TalentPoolCard key={entry.id} entry={entry} />)}</div> : null}{query.data && !entries.length ? <EmptyState title={all.length ? "Không tìm thấy ứng viên phù hợp" : "Kho ứng viên đang trống"} description={all.length ? "Thử thay đổi từ khóa hoặc bộ lọc." : "Mở một hồ sơ ứng tuyển đã có sự đồng ý để lưu vào kho."} /> : null}<div className="flex gap-3 rounded-[10px] border border-border bg-surface p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" /><p className="text-xs leading-5 text-muted"><strong className="text-ink">Nguyên tắc lưu dữ liệu:</strong> chỉ lưu hồ sơ có sự đồng ý, có hạn lưu rõ ràng và chỉ dùng cho tuyển dụng nội bộ. MVP không hỗ trợ nhập CV ngoài hệ thống hoặc gửi chiến dịch hàng loạt.</p></div></div>;
}

function Summary({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note?: string }) { return <div className="bg-surface p-5"><div className="flex items-center justify-between text-brand">{icon}<span className="text-2xl font-semibold tracking-[-0.03em] text-ink">{value}</span></div><p className="mt-3 text-xs font-semibold text-ink">{label}</p>{note ? <p className="mt-1 text-[11px] text-muted">{note}</p> : null}</div>; }
