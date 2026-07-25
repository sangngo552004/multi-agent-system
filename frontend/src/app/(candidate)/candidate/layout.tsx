import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Ứng viên",
    template: "%s | Career Platform",
  },
};

import { CandidateHeader } from "./components/candidate-header";

export default function CandidateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <CandidateHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
