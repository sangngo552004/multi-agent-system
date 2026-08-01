"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandidateApplicationService, CandidateApplicationResponse } from "@/services/http/http-candidate-application.service";
import { format } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ApplicationsClient() {
  const [applications, setApplications] = useState<CandidateApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvice, setSelectedAdvice] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    CandidateApplicationService.getMyApplications()
      .then((res) => setApplications(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Đã nộp (Pending)</Badge>;
      case "SHORTLISTED":
      case "INVITED":
        return <Badge variant="default" className="bg-green-500">Chấp thuận (Shortlisted)</Badge>;
      case "REJECTED":
      case "REJECTED_FINAL":
        return <Badge variant="destructive">Từ chối (Rejected)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Bạn chưa nộp đơn ứng tuyển nào.</p>
          </CardContent>
        </Card>
      ) : (
        applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">{app.jobTitle || "Vị trí ứng tuyển"}</CardTitle>
                <CardDescription>Đã nộp vào {format(new Date(app.appliedAt), "dd/MM/yyyy HH:mm")}</CardDescription>
              </div>
              {getStatusBadge(app.status)}
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!selectedAdvice} onOpenChange={(open) => !open && setSelectedAdvice(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Career Path Advice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAdvice && (
              <>
                <div>
                  <h4 className="font-semibold text-lg">Overall Assessment</h4>
                  <p className="text-sm text-muted-foreground">{selectedAdvice.overall_assessment}</p>
                </div>
                {Array.isArray(selectedAdvice.phases) && selectedAdvice.phases.map((phase: Record<string, unknown>, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-md">{String(phase.phase_name)} ({String(phase.duration_months)} months)</CardTitle>
                      <CardDescription>{String(phase.objective)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {phase.recommended_actions?.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
