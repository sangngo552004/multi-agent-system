"use client";

import { useEffect, useState } from "react";
import { CandidateJobService, JobResponse } from "@/services/http/http-candidate-job.service";
import { CandidateApplicationService } from "@/services/http/http-candidate-application.service";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/auth-provider";
import { useRouter } from "next/navigation";

export function CandidateJobDetailClient({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    CandidateJobService.getJobDetail(jobId)
      .then((res) => setJob(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải thông tin công việc.");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApplyClick = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để ứng tuyển.");
      router.push(`/vi/login?next=/vi/candidate/jobs/${jobId}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async () => {
    if (!cvFile) {
      toast.error("Vui lòng tải lên CV của bạn.");
      return;
    }

    setIsApplying(true);
    try {
      await CandidateApplicationService.applyForJob(jobId, cvFile);
      toast.success("Nộp đơn ứng tuyển thành công!");
      setIsApplyModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi nộp đơn.");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!job) {
    return <div className="text-center py-12 text-muted-foreground">Không tìm thấy công việc.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl">{job.title}</CardTitle>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>📍 {job.location}</span>
              <span>🕒 {job.employmentType}</span>
            </div>
          </div>
          <Button onClick={handleApplyClick} size="lg" disabled={isApplying}>
            {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Ứng tuyển ngay
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mô tả công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{job.description}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yêu cầu ứng viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{job.requirements}</div>
        </CardContent>
      </Card>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ứng tuyển {job.title}</DialogTitle>
            <DialogDescription>
              Tải lên CV của bạn để ứng tuyển. CV sẽ được AI của chúng tôi phân tích tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cv" className="text-right">
                File CV
              </Label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                className="col-span-3"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Hủy</Button>
            <Button onClick={handleApplySubmit} disabled={isApplying || !cvFile}>
              {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isApplying ? "Đang xử lý..." : "Nộp CV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
