import { redirect } from "@/i18n/routing";

export default async function LegacyHrLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/hr/login", locale });
}
