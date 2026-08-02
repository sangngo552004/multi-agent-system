"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from "@/services/http/api-client";
import type { HrJobFormValues } from "../jobs.schema";

export function JobAiParserModal() {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const { setValue } = useFormContext<HrJobFormValues>();

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error("Vui lòng nhập nội dung tuyển dụng.");
      return;
    }

    setIsParsing(true);
    try {
      const result = await fetchApi<Record<string, unknown>>("/hr/jobs/parse", {
        method: "POST",
        body: JSON.stringify({ rawText }),
      });

      // Map result to form
      if (result.title) setValue("title", result.title, { shouldValidate: true, shouldDirty: true });
      if (result.description) setValue("description", result.description, { shouldValidate: true, shouldDirty: true });
      if (result.requirementsText && Array.isArray(result.requirementsText)) {
        setValue("requirementsText", result.requirementsText, { shouldValidate: true, shouldDirty: true });
      }
      if (result.benefitsText && Array.isArray(result.benefitsText)) {
        setValue("benefitsText", result.benefitsText, { shouldValidate: true, shouldDirty: true });
      }

      toast.success("AI đã trích xuất dữ liệu thành công!");
      setOpen(false);
      setRawText("");
    } catch (error: unknown) {
      handleApiError(error, t);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand">
          <Sparkles className="mr-2 size-4" /> Tạo tự động bằng AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-brand" />
            Trích xuất thông tin tự động
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted">
            Dán nội dung Job Description (JD) thô vào đây. AI sẽ phân tích và tự động điền các trường như <strong>Tên vị trí, Mô tả, Yêu cầu, Quyền lợi</strong> giúp bạn tiết kiệm thời gian.
          </p>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Dán nội dung JD vào đây..."
            className="min-h-[250px] font-sans"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isParsing}>Hủy</Button>
            <Button type="button" onClick={handleParse} disabled={isParsing || !rawText.trim()}>
              {isParsing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              Phân tích bằng AI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
