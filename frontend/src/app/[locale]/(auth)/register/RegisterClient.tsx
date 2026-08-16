"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiRequest } from "@/services/http/api-client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const getRegisterSchema = (t: unknown) => z.object({
  fullName: z.string().min(1, t("validation.fullNameRequired")),
  email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
  password: z.string()
    .min(8, t("validation.passwordMinLength"))
    .regex(passwordRegex, t("validation.passwordRegex")),
  confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("validation.passwordMismatch"),
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;

export function RegisterClient() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSchema = getRegisterSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError("");
    try {
      await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: "CANDIDATE",
        }),
        authenticated: false,
      });

      setRegisteredEmail(data.email);
      setIsSuccess(true);
      toast.success(t("register.successTitle"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("register.errorDefault"));
      }
    }
  };

  if (isSuccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
        <section className="w-full max-w-md rounded-[14px] border border-border bg-surface p-7 shadow-float sm:p-9 text-center">
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
            {t("register.successTitle")}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            {t("register.successDescPrefix")} <strong>{registeredEmail}</strong>. {t("register.successDescSuffix")}
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
            {t("register.goToLogin")}
          </Button>
        </section>
      </main>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-ink text-center">
            {t("register.title")}
          </h1>
          <p className="mt-2 text-sm text-center text-muted">
            {t("register.subtitle")}
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="fullName" className="mb-2 block text-xs font-semibold text-ink">
              {t("register.fullName")}
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
              className={errors.fullName ? "border-danger" : ""}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold text-ink">
              {t("register.email")}
            </label>
            <Input
              id="email"
              type="email"
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
              {t("register.password")}
            </label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} className={errors.password ? "border-danger pr-10" : "pr-10"} />
              <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-ink">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-xs font-semibold text-ink"
            >
              {t("register.confirmPassword")}
            </label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...register("confirmPassword")} className={errors.confirmPassword ? "border-danger pr-10" : "pr-10"} />
              <button type="button" aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-ink">
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>
          {error && (
            <p className="rounded-[9px] border border-danger/20 bg-danger/[0.04] px-3 py-2 text-xs leading-5 text-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UserPlus className="size-4 mr-2" />}
            {t("register.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t("register.hasAccount")}{" "}
          <I18nLink href="/login" className="text-brand font-semibold hover:underline">
            {t("register.loginNow")}
          </I18nLink>
        </p>
      </section>
    </main>
  );
}
