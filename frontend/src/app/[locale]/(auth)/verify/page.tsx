"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicService } from "@/services/public.service";
import { useTranslations } from "next-intl";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("Auth.verify");

  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMessage(t("errorSubtitle"));
      return;
    }

    const verifyToken = async () => {
      try {
        await publicService.verifyRegistration(token);
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(t("errorSubtitle"));
        }
      }
    };

    verifyToken();
  }, [token, t]);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <section className="relative w-full max-w-md rounded-2xl border border-border bg-white/80 backdrop-blur-sm p-7 shadow-xl sm:p-9 text-center">

        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="size-16 text-brand animate-spin mb-6" />
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
              {t("processing")}
            </h1>
            <p className="text-sm text-muted">
              {t("processingSubtitle")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="size-16 text-emerald-500 mb-6" />
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
              {t("successTitle")}
            </h1>
            <p className="text-sm text-muted mb-8">
              {t("successSubtitle")}
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              <LogIn className="size-4 mr-2" />
              {t("goToLogin")}
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6">
            <XCircle className="size-16 text-danger mb-6" />
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
              {t("errorTitle")}
            </h1>
            <p className="text-sm text-danger mb-8">
              {errorMessage}
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" className="w-full" onClick={() => router.push("/")}>
                <Home className="size-4 mr-2" />
                {t("goToHome")}
              </Button>
              <Button className="w-full" onClick={() => router.push("/login")}>
                <LogIn className="size-4 mr-2" />
                {t("goToLogin")}
              </Button>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
