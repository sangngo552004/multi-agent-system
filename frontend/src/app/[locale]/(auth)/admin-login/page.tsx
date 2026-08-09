import { redirect } from "@/i18n/routing";

export default async function LegacyAdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/login", locale });
}
