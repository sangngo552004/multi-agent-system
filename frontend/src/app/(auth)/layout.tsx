import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Xác thực",
    template: "%s | Career Platform",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
