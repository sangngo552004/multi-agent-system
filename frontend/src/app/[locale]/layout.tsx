import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PTIT Careers",
    template: "%s · PTIT Careers",
  },
  description: "Cổng thông tin việc làm và tuyển dụng của Học viện Công nghệ Bưu chính Viễn thông.",
  icons: { icon: "/icons/ptit-logo.webp" },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
