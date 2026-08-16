"use client";

import { useState } from "react";
import { Mail, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest as fetchApi } from "@/services/http/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { hrQueryKeys } from "@/services/query-keys";

const emailTemplates = {
  INVITE: {
    subject: "PTIT | Thông báo kết quả ứng tuyển – Vòng trao đổi tiếp theo",
    body:
      "Kính gửi Anh/Chị,\n\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT) trân trọng cảm ơn Anh/Chị đã quan tâm và ứng tuyển vào vị trí tuyển dụng của Học viện.\n\nSau quá trình xem xét, hồ sơ của Anh/Chị được đánh giá phù hợp với yêu cầu của vị trí. Bộ phận Tuyển dụng PTIT sẽ liên hệ để trao đổi về các bước tiếp theo.\n\nTrân trọng,\nBan Tuyển dụng\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT)",
  },
  REJECT: {
    subject: "PTIT | Thông báo kết quả ứng tuyển",
    body:
      "Kính gửi Anh/Chị,\n\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT) trân trọng cảm ơn Anh/Chị đã dành thời gian tham gia quy trình tuyển dụng.\n\nSau khi xem xét tổng thể, chúng tôi rất tiếc chưa thể đồng hành cùng Anh/Chị ở vị trí này trong đợt tuyển dụng hiện tại. Dưới đây là lộ trình phát triển cá nhân được xây dựng dựa trên hồ sơ của Anh/Chị để Anh/Chị tham khảo.\n\nPTIT trân trọng ghi nhận sự quan tâm của Anh/Chị và chúc Anh/Chị gặt hái nhiều thành công trong chặng đường sắp tới.\n\nTrân trọng,\nBan Tuyển dụng\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT)",
  },
  REJECT_WITHOUT_CAREER_PATH: {
    subject: "PTIT | Thông báo kết quả ứng tuyển",
    body:
      "Kính gửi Anh/Chị,\n\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT) trân trọng cảm ơn Anh/Chị đã dành thời gian tham gia quy trình tuyển dụng.\n\nSau khi xem xét tổng thể, chúng tôi rất tiếc chưa thể đồng hành cùng Anh/Chị ở vị trí này trong đợt tuyển dụng hiện tại.\n\nPTIT trân trọng ghi nhận sự quan tâm của Anh/Chị và chúc Anh/Chị gặt hái nhiều thành công trong chặng đường sắp tới.\n\nTrân trọng,\nBan Tuyển dụng\nHọc viện Công nghệ Bưu chính Viễn thông (PTIT)",
  },
} as const;

export function BatchEmailModal({ applicationIds, action, includeCareerPath = false, jobId }: { applicationIds: string[]; action: "INVITE" | "REJECT"; includeCareerPath?: boolean; jobId: string }) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const queryClient = useQueryClient();
  const recipientIds = applicationIds;

  const handleStart = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Vui lòng nhập Tiêu đề và Nội dung email.");
      return;
    }
    if (!recipientIds.length) {
      toast.error("Không có ứng viên phù hợp với nhóm nhận đã chọn.");
      return;
    }

    setIsStarting(true);
    try {
      await fetchApi<string>("/api/v1/hr/applications/batch-email", {
        method: "POST",
        body: JSON.stringify({
          applicationIds: recipientIds,
          action,
          subjectTemplate: subject,
          bodyTemplate: body
        }),
      });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: hrQueryKeys.jobEmailHistory(jobId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.applications({ jobId }) });
      toast.success("Đã tạo tác vụ gửi mail. Theo dõi trạng thái tại bảng lịch sử bên dưới.");
    } catch (error: unknown) {
      handleApiError(error, t);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (val) {
        const template = action === "REJECT" && !includeCareerPath ? emailTemplates.REJECT_WITHOUT_CAREER_PATH : emailTemplates[action];
        setSubject(template.subject);
        setBody(template.body);
      }
      setOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="hidden sm:flex">
          <Mail className="mr-2 size-4" /> Gửi mail
        </Button>
      </DialogTrigger>
      <DialogContent title={action === "INVITE" ? "Gửi thư mời" : "Gửi thư từ chối"} className="max-w-md">
        <div className="space-y-4 py-4">
            <p className="rounded-lg bg-surface-soft p-3 text-xs text-muted">Đây là phần nội dung chung của PTIT. Bạn có thể chỉnh sửa trước khi gửi. · {recipientIds.length} ứng viên nhận email.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Tiêu đề Email</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Vd: Thông báo kết quả ứng tuyển..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Nội dung</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nhập nội dung thư..." rows={5} />
            </div>
            {action === "REJECT" && includeCareerPath ? <div className="rounded-lg border border-info/20 bg-info/5 p-3 text-xs leading-5 text-ink"><div className="flex items-center gap-2 font-semibold"><Info className="size-4 text-info" /> Phần hệ thống tự chèn cho từng ứng viên</div><p className="mt-1 text-muted">Phần này không nằm trong ô nội dung ở trên. Khi gửi, PTIT sẽ nối Career Path riêng của từng ứng viên vào cuối mail, gồm tóm tắt, các trọng tâm phát triển và bước đầu tiên.</p><p className="mt-2 font-medium text-info">{recipientIds.length} ứng viên được chọn = {recipientIds.length} nội dung Career Path khác nhau.</p></div> : null}
            {action === "REJECT" && !includeCareerPath ? <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-xs leading-5 text-ink"><div className="flex items-center gap-2 font-semibold"><Info className="size-4 text-success" /> Không cần Career Path</div><p className="mt-1 text-muted">Các hồ sơ này không có khoảng trống phát triển cần gợi ý, nên PTIT sẽ gửi thư từ chối tiêu chuẩn và không đính kèm lộ trình.</p></div> : null}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="button" onClick={handleStart} loading={isStarting}>
                Bắt đầu gửi
              </Button>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
