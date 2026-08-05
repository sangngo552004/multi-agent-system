"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { apiRequest as fetchApi } from "@/services/http/api-client";
import type { HrJobFormValues } from "../jobs.schema";

export function JobAiParserModal() {
  const t = useTranslations();
  const { setValue } = useFormContext<HrJobFormValues>();

  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error("Vui lòng dán nội dung tuyển dụng vào ô trống.");
      return;
    }

    setIsParsing(true);
    try {
      const result = await fetchApi<Record<string, unknown>>("/hr/jobs/parse", {
        method: "POST",
        body: JSON.stringify({ rawText }),
      });

      // Map result to form
      if (result.title) setValue("title", result.title as unknown, { shouldValidate: true, shouldDirty: true });
      if (result.description) setValue("description", result.description as unknown, { shouldValidate: true, shouldDirty: true });
      if (result.requirementsText && Array.isArray(result.requirementsText)) {
        setValue("requirementsText", result.requirementsText as unknown, { shouldValidate: true, shouldDirty: true });
      }
      if (result.benefitsText && Array.isArray(result.benefitsText)) {
        setValue("benefitsText", result.benefitsText as unknown, { shouldValidate: true, shouldDirty: true });
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
        <Button variant="secondary" className="border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand">
          <Sparkles className="mr-2 size-4" /> Tạo tự động bằng AI
        </Button>
      </DialogTrigger>
      <DialogContent title="Phân tích mô tả công việc (AI Parser)" className="max-w-xl">
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted">Dán JD gốc (Mô tả, Yêu cầu, Quyền lợi) vào đây. AI sẽ tự động bóc tách và điền vào form cho bạn.</p>
          <Textarea
            placeholder="Dán nội dung JD vào đây..."
            className="min-h-[250px] font-mono text-sm leading-relaxed"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="button" onClick={handleParse} loading={isParsing}>
              {isParsing ? <><Loader2 className="mr-2 size-4 animate-spin" /> Đang phân tích...</> : <><Sparkles className="mr-2 size-4" /> Phân tích ngay</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
