"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CandidateApplicationService, CandidateApplicationResponse } from "@/services/http/http-candidate-application.service";
import { format } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-provider";
import { useRouter } from "next/navigation";

export function ApplicationsClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/profile/applications");
    }
  }, [user, authLoading, router]);

  const [applications, setApplications] = useState<CandidateApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvice, setSelectedAdvice] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    CandidateApplicationService.getMyApplications()
      .then((res) => setApplications(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge tone="info">Đã nộp (Pending)</Badge>;
      case "SHORTLISTED":
      case "INVITED":
        return <Badge tone="success">Chấp thuận (Shortlisted)</Badge>;
      case "REJECTED":
      case "REJECTED_FINAL":
        return <Badge tone="danger">Từ chối (Rejected)</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  if (loading || authLoading || (!user && !authLoading)) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-border">
          <div className="p-6 flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Bạn chưa nộp đơn ứng tuyển nào.</p>
          </div>
        </div>
      ) : (
        applications.map((app) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-border">
            <div className="p-6 flex flex-row items-center justify-between pb-2">
              <div>
                <h3 className="text-xl font-semibold leading-none tracking-tight">{app.jobTitle || "Vị trí ứng tuyển"}</h3>
                <p className="text-sm text-muted-foreground">Đã nộp vào {format(new Date(app.appliedAt), "dd/MM/yyyy HH:mm")}</p>
              </div>
              {getStatusBadge(app.status)}
            </div>
            <div className="p-6 pt-0">
              <div className="flex justify-between items-center mt-4">
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> Xem CV đã nộp
                </a>

                {app.careerPathAdvice && (
                  <button
                    onClick={() => setSelectedAdvice(app.careerPathAdvice)}
                    className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Xem lời khuyên lộ trình từ AI
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <Dialog open={!!selectedAdvice} onOpenChange={(open) => !open && setSelectedAdvice(null)}>
        <DialogContent title="AI Career Path Advice" className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            {selectedAdvice && (
              <>
                <div>
                  <h4 className="font-semibold text-lg">Overall Assessment</h4>
                  <p className="text-sm text-muted-foreground">{String(selectedAdvice.overall_assessment)}</p>
                </div>
                {Array.isArray(selectedAdvice.phases) && selectedAdvice.phases.map((phase: Record<string, unknown>, index: number) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-border p-6">
                    <div className="pb-4">
                      <h3 className="text-md font-semibold leading-none tracking-tight">{String(phase.phase_name)} ({String(phase.duration_months)} months)</h3>
                      <p className="text-sm text-muted-foreground">{String(phase.objective)}</p>
                    </div>
                    <div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {Array.isArray(phase.recommended_actions) && phase.recommended_actions.map((action: unknown, i: number) => (
                          <li key={i}>{String(action)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
