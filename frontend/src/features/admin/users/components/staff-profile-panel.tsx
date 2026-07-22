import { BriefcaseBusiness, Building2, IdCard, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/types/domain/admin";

export function StaffProfilePanel({ user }: { user: AdminUser }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="admin-kicker text-brand">Danh bạ tổ chức</p>
          <h2 className="mt-1 text-base font-semibold text-ink">Thông tin nhân sự nội bộ</h2>
        </div>
        <Badge tone="info">Nhân sự nội bộ</Badge>
      </header>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Info icon={IdCard} label="Mã nhân viên" value={user.employeeCode ?? "Chưa cập nhật"} />
        <Info icon={Building2} label="Đơn vị công tác" value={user.departmentName ?? "Chưa cập nhật"} />
        <Info icon={BriefcaseBusiness} label="Chức danh" value={user.jobTitle ?? "Chưa cập nhật"} />
        <Info icon={MapPin} label="Địa điểm làm việc" value={user.workLocation ?? "Chưa cập nhật"} />
        <Info icon={Mail} label="Email nội bộ" value={user.email} className="sm:col-span-2" />
      </div>
      <p className="border-t border-border bg-surface-soft/40 px-5 py-3 text-xs leading-5 text-muted">
        Thông tin nhân sự được đồng bộ từ danh bạ nội bộ; Admin chỉ quản lý quyền truy cập tại màn hình này.
      </p>
    </section>
  );
}

function Info({ icon: Icon, label, value, className }: { icon: typeof IdCard; label: string; value: string; className?: string }) {
  return (
    <div className={`flex gap-3 rounded-[9px] border border-border/80 p-3.5 ${className ?? ""}`}>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{label}</p><p className="mt-1 text-sm leading-5 text-ink">{value}</p></div>
    </div>
  );
}
