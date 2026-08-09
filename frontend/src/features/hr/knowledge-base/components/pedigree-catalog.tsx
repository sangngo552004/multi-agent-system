"use client";

import { Building2, Info, Layers3 } from "lucide-react";
import { usePedigreeGroups, usePedigrees } from "../knowledge-base.queries";

const sourceLabel = { EXPERIENCE: "Công ty/agency trong kinh nghiệm", EDUCATION: "Trường học", CERTIFICATION: "Đơn vị cấp chứng chỉ", GPA: "Điểm GPA" } as const;

export function PedigreeCatalog({ mode }: { mode: "organizations" | "groups" }) {
  const pedigrees = usePedigrees();
  const groups = usePedigreeGroups();
  if (pedigrees.isLoading || groups.isLoading) return <div className="rounded-[12px] border border-border bg-surface p-6 text-sm text-muted">Đang tải catalog đối chiếu…</div>;
  if (mode === "organizations") return <section className="rounded-[12px] border border-border bg-surface"><header className="border-b border-border p-4"><h2 className="font-semibold text-ink">Tổ chức và biến thể tên</h2><p className="mt-1 text-sm text-muted">Tên trong CV được chuẩn hoá qua alias trước khi kiểm tra Rule.</p></header><div className="divide-y divide-border">{(pedigrees.data ?? []).map((item) => <article key={item.id} className="flex gap-3 p-4"><Building2 className="mt-0.5 size-4 text-brand" /><div><p className="font-medium text-ink">{item.name} <span className="ml-2 text-xs text-muted">{item.type}</span></p><p className="mt-1 text-xs text-muted">Alias: {item.aliases?.join(" · ") || "Chưa có alias"}</p></div></article>)}</div></section>;
  return <section className="rounded-[12px] border border-border bg-surface"><header className="border-b border-border p-4"><div className="flex items-center gap-2"><h2 className="font-semibold text-ink">Nhóm tổ chức đối chiếu</h2><span title="Một Group là danh sách tổ chức mà Rule sử dụng để kiểm tra bằng chứng trong CV."><Info className="size-4 text-muted" /></span></div><p className="mt-1 text-sm text-muted">Group không cộng điểm; Bonus Rule mới quy định điểm cộng.</p></header><div className="grid gap-3 p-4 sm:grid-cols-2">{(groups.data ?? []).map((group) => <article key={group.id} className="rounded-[10px] border border-border bg-surface-soft p-4"><div className="flex items-center gap-2"><Layers3 className="size-4 text-brand" /><h3 className="font-medium text-ink">{group.name}</h3></div><p className="mt-2 text-xs text-muted">{sourceLabel[group.evidenceSource]} · {group.memberIds.length} tổ chức</p><code className="mt-3 block text-xs text-faint">{group.code}</code></article>)}</div></section>;
}
