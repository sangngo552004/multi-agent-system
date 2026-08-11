"use client";

import { format } from "date-fns";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-provider";
import {
  CandidateApplicationService,
  type CandidateApplicationResponse,
} from "@/services/http/http-candidate-application.service";

type Advice = Record<string, unknown>;

function text(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function number(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function records(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Advice => Boolean(item) && typeof item === "object")
    : [];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge tone="info">Đã nộp · Đang xử lý</Badge>;
    case "SHORTLISTED":
    case "INVITED":
      return <Badge tone="success">Được chọn vào vòng tiếp theo</Badge>;
    case "REJECTED":
    case "REJECTED_FINAL":
      return <Badge tone="danger">Chưa phù hợp</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export function ApplicationsClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<CandidateApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvice, setSelectedAdvice] = useState<Advice | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/profile/applications");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    CandidateApplicationService.getMyApplications()
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading || authLoading || (!user && !authLoading)) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!applications.length ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center text-muted">
          Bạn chưa nộp hồ sơ ứng tuyển nào.
        </div>
      ) : (
        applications.map((application) => (
          <article key={application.id} className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-start justify-between gap-5 p-6 pb-2">
              <div>
                <h2 className="text-xl font-semibold">{application.jobTitle || "Vị trí ứng tuyển"}</h2>
                <p className="mt-2 text-sm text-muted">
                  Đã nộp lúc {format(new Date(application.appliedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>
            <div className="flex items-center justify-between gap-4 p-6 pt-3">
              <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm text-brand hover:underline">
                <ExternalLink className="mr-1 size-4" /> Xem CV đã nộp
              </a>
              {application.careerPathAdvice ? (
                <button type="button" onClick={() => setSelectedAdvice(application.careerPathAdvice)} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                  Xem lộ trình phát triển
                </button>
              ) : null}
            </div>
          </article>
        ))
      )}

      <Dialog open={Boolean(selectedAdvice)} onOpenChange={(open) => !open && setSelectedAdvice(null)}>
        <DialogContent title="Lộ trình phát triển do AI gợi ý" className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {selectedAdvice ? (
            <div className="mt-5 space-y-5">
              <section className="rounded-lg bg-surface-soft p-4">
                <p className="text-sm leading-6 text-ink">{text(selectedAdvice.message)}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{text(selectedAdvice.summary)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <Badge tone="info">Mục tiêu: {text(selectedAdvice.target_role)}</Badge>
                  <Badge>{number(selectedAdvice.total_duration_weeks) ?? "—"} tuần</Badge>
                  <Badge>{number(selectedAdvice.hours_per_week) ?? "—"} giờ/tuần</Badge>
                </div>
              </section>

              {strings(selectedAdvice.demonstrated_strengths).length ? (
                <section><h3 className="font-semibold">Điểm mạnh đã thể hiện</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{strings(selectedAdvice.demonstrated_strengths).map((item) => <li key={item}>{item}</li>)}</ul></section>
              ) : null}
              {strings(selectedAdvice.priority_growth_areas).length ? (
                <section><h3 className="font-semibold">Năng lực nên ưu tiên</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{strings(selectedAdvice.priority_growth_areas).map((item) => <li key={item}>{item}</li>)}</ul></section>
              ) : null}

              <section className="space-y-3">
                {records(selectedAdvice.phases).map((phase, index) => (
                  <article key={`${text(phase.title)}-${index}`} className="rounded-xl border border-border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">Giai đoạn {index + 1}: {text(phase.title)}</h3>
                      <Badge>{number(phase.duration_weeks) ?? "—"} tuần</Badge>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {records(phase.activities).map((activity, activityIndex) => (
                        <li key={`${text(activity.title)}-${activityIndex}`} className="text-sm">
                          <strong>{text(activity.title)}</strong>
                          <p className="mt-1 leading-6 text-muted">{text(activity.description)}</p>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </section>

              <section className="rounded-lg border border-border p-4">
                <h3 className="font-semibold">Bước tiếp theo</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text(selectedAdvice.next_action)}</p>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
