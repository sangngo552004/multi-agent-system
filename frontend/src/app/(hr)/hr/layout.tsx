import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "HR",
    template: "%s | HR",
  },
};

export default function HrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
