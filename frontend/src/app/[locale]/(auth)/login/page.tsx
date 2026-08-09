"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";

const roleDestinations = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  CANDIDATE: "/profile",
} as const;

const getLoginSchema = (t: unknown) => z.object({
  email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
  password: z.string().min(1, t("validation.passwordRequired")),
});

type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const { candidateLogin } = useAuth();
  const [error, setError] = useState("");

  const loginSchema = getLoginSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    try {
      const user = await candidateLogin({ email: data.email, password: data.password });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const safeAdminPath =
        user.role === "ADMIN" && requestedPath?.startsWith("/admin/")
          ? requestedPath
          : null;
      router.replace(safeAdminPath ?? roleDestinations[user.role]);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : t("login.errorDefault"),
      );
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <section className="relative w-full max-w-md rounded-2xl border border-border bg-white/80 backdrop-blur-sm p-7 shadow-xl sm:p-9">
        <Link href="/" className="absolute top-6 left-6 text-muted hover:text-ink transition-colors flex items-center justify-center p-2 rounded-full hover:bg-surface-soft">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center bg-brand text-white font-bold w-16 h-16 rounded-xl text-3xl mb-4 hover:opacity-90 transition-opacity shadow-md">
              P
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {t("login.title")}
          </h1>
          <p className="mt-2 text-sm text-center text-muted">
            {t("login.subtitle")}
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold text-ink">
              {t("login.email")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              {...register("email")}
              className={errors.email ? "border-danger" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold text-ink"
            >
              {t("login.password")}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? "border-danger" : ""}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <p className="rounded-[9px] border border-danger/20 bg-danger/[0.04] px-3 py-2 text-xs leading-5 text-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            <LogIn className="size-4" />
            {t("login.submit")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t("login.noAccount")}{" "}
          <I18nLink href="/register" className="text-brand font-semibold hover:underline">
            {t("login.registerNow")}
          </I18nLink>
        </p>
      </section>
    </main>
  );
}
