"use client";

import { usePublicJob } from "@/features/public/jobs/jobs.queries";
import { PublicHeader } from "@/components/layout/public-header";
import { MapPin, Briefcase, Calendar, ChevronLeft, Loader2, Share2, Building2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/features/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CvUploader } from "@/app/[locale]/(candidate)/profile/components/cv/CvUploader";
import { useState, use } from "react";
import { CandidateApplicationService } from "@/services/http/http-candidate-application.service";
import { toast } from "sonner";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: job, isLoading } = usePublicJob(resolvedParams.id);
  const { user } = useAuth();
  const router = useRouter();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyClick = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để ứng tuyển.");
      router.push(`/login?next=/jobs/${resolvedParams.id}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleUploadCv = async (file: File) => {
    if (!job) return;
    setIsApplying(true);
    try {
      await CandidateApplicationService.applyForJob(job.id, file);
      toast.success("Ứng tuyển thành công. Hồ sơ của bạn đã được ghi nhận.");
      setIsApplyModalOpen(false);
      // Optional: Redirect to candidate applications page
      router.push("/profile/applications");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyWithMasterCv = async () => {
    if (!job) return;
    setIsApplying(true);
    try {
      await CandidateApplicationService.applyWithMasterCv(job.id);
      toast.success("Ứng tuyển thành công. Hồ sơ của bạn đã được ghi nhận.");
      setIsApplyModalOpen(false);
      router.push("/profile/applications");
    } catch (error: unknown) {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Có lỗi xảy ra khi ứng tuyển bằng Master CV. Vui lòng thử lại.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <PublicHeader />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
          <p className="mt-4 text-muted">Đang tải thông tin vị trí...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <PublicHeader />
        <div className="flex-1 max-w-7xl mx-auto px-6 py-20 text-center w-full">
          <h2 className="text-2xl font-bold text-ink">Không tìm thấy vị trí tuyển dụng</h2>
          <p className="text-muted mt-4 mb-8">Vị trí này có thể đã hết hạn hoặc không tồn tại.</p>
          <Link href="/jobs" className="inline-flex items-center text-brand font-medium hover:underline">
            <ChevronLeft className="size-4 mr-2" /> Về danh sách việc làm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <PublicHeader />

      {/* Header Banner */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:px-8">
          <Link href="/jobs" className="inline-flex items-center text-muted hover:text-brand transition-colors mb-6 text-sm font-medium">
            <ChevronLeft className="size-4 mr-1" /> Quay lại danh sách
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-6 leading-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-soft px-3 py-1.5 font-medium ring-1 ring-inset ring-border-strong">
              <Building2 className="size-4 text-ink" /> {job.jobFamilyName || job.jobFamilyId}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-soft px-3 py-1.5 font-medium ring-1 ring-inset ring-border-strong">
              <MapPin className="size-4 text-ink" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-soft px-3 py-1.5 font-medium ring-1 ring-inset ring-border-strong">
              <Briefcase className="size-4 text-ink" /> {job.employmentType === "FULL_TIME" ? "Toàn thời gian" : job.employmentType}
            </span>
            {job.expiredAt && (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Calendar className="size-4" /> Hạn nộp: {format(new Date(job.expiredAt), "dd/MM/yyyy", { locale: vi })}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 lg:px-8 w-full flex flex-col gap-10">

        <section className="bg-white rounded-2xl p-8 border border-border shadow-sm">
          <h2 className="text-xl font-bold text-ink mb-6 border-b border-border pb-4">Mô tả công việc</h2>
          <div className="prose prose-brand max-w-none text-ink/80 whitespace-pre-wrap">
            {job.description || "Chưa có mô tả."}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-8 border border-border shadow-sm">
          <h2 className="text-xl font-bold text-ink mb-6 border-b border-border pb-4">Yêu cầu ứng viên</h2>
          <div className="prose prose-brand max-w-none text-ink/80 whitespace-pre-wrap">
            {job.requirements || "Chưa có yêu cầu."}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-8 border border-border shadow-sm">
          <h2 className="text-xl font-bold text-ink mb-6 border-b border-border pb-4">Quyền lợi</h2>
          <div className="prose prose-brand max-w-none text-ink/80 whitespace-pre-wrap">
            {job.benefits || "Chưa có quyền lợi."}
          </div>
        </section>

        <div className="flex items-center justify-between bg-surface-soft rounded-2xl p-6 border border-border">
          <div>
            <h3 className="font-semibold text-ink">Bạn đã sẵn sàng ứng tuyển?</h3>
            <p className="text-sm text-muted mt-1">Đừng bỏ lỡ cơ hội gia nhập đội ngũ của chúng tôi.</p>
          </div>
          <button
            onClick={handleApplyClick}
            className="bg-brand text-white font-medium px-6 py-3 rounded-xl shadow-sm hover:bg-brand/90 transition-colors flex items-center gap-2"
          >
            Ứng tuyển ngay
          </button>
        </div>
      </main>

      <footer className="bg-white border-t border-border mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between lg:px-8">
          <p className="text-sm text-muted">PTIT Careers © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Apply Modal */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent title="Ứng tuyển vị trí" description={job.title} className="max-w-3xl">
          <div className="mt-4 flex flex-col gap-6">
            <CvUploader onUpload={handleUploadCv} isUploading={isApplying} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted">Hoặc</span>
              </div>
            </div>

            <button
              onClick={handleApplyWithMasterCv}
              disabled={isApplying}
              className="w-full bg-surface-soft border border-border text-ink font-medium px-6 py-3 rounded-xl hover:bg-surface disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Ứng tuyển nhanh bằng Master CV (Hồ sơ cá nhân)
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
