"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CvUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  compact?: boolean;
}

export function CvUploader({ onUpload, isUploading, compact = false }: CvUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  async function processFile(file: File) {
    // Validate file type
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Vui lòng chỉ tải lên file PDF.");
      return;
    }

    // Validate size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file dưới 5MB.");
      return;
    }

    try {
      await onUpload(file);
    } catch {
      toast.error("Có lỗi xảy ra khi tải file lên.");
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await processFile(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onUpload]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  if (compact) {
    return (
      <label className={`inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors ${isUploading ? "pointer-events-none opacity-70" : "cursor-pointer hover:bg-surface-soft"}`}>
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {isUploading ? "Đang xử lý CV..." : "Thay CV mới"}
      </label>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tải lên Hồ Sơ của bạn
        </h1>
        <p className="text-gray-600">
          Tải lên CV PDF để hệ thống tự động điền thông tin vào hồ sơ.
        </p>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4 text-indigo-600">
            <Loader2 className="w-12 h-12 animate-spin" />
            <div className="font-medium">
              Đang xử lý CV... Vui lòng đợi
            </div>
            <p className="text-sm text-indigo-400/80 max-w-xs mx-auto">
              Hệ thống đang cập nhật thông tin trong hồ sơ từ CV của bạn.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <UploadCloud className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <span className="font-semibold text-indigo-600">
                Nhấn để tải lên
              </span>{" "}
              hoặc kéo thả file vào đây
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              <span>Chỉ hỗ trợ PDF (Tối đa 5MB)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
