import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Ứng viên",
    template: "%s | Career Platform",
  },
};

export default function CandidateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
