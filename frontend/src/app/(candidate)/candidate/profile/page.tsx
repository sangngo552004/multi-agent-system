/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "CV Analysis Complete – AI Resume Insights",
  description:
    "AI-powered CV analysis with confidence score, extracted skills, key projects, and personalized resume insights.",
  openGraph: {
    title: "CV Analysis Complete – AI Resume Insights",
    description:
      "AI-powered CV analysis with confidence score and personalized resume insights.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function CandidateProfilePage() {
  return <ProfileClient />;
}
