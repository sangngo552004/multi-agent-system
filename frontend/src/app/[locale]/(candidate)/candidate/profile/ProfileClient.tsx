"use client";

import React, { useState } from "react";
import { CvAnalysisView } from "./components/cv";
import { CvUploader } from "./components/cv/CvUploader";
import { candidateService } from "@/services/candidate.service";
import type { CvAnalysis } from "@/types/domain/cv-analysis";

export function ProfileClient() {
  const [cvData, setCvData] = useState<CvAnalysis | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await candidateService.extractCv(file);
      setCvData(result);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500;600;700&family=Google+Sans+Display:wght@400;500;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"
      />

      {cvData ? (
        <CvAnalysisView data={cvData} onReset={() => setCvData(null)} />
      ) : (
        <div className="pt-24 pb-16">
          <CvUploader onUpload={handleUpload} isUploading={isUploading} />
        </div>
      )}
    </>
  );
}
