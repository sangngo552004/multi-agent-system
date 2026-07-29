"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";

const roleDestinations = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  CANDIDATE: "/candidate/dashboard",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
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
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
      <section className="w-full max-w-md rounded-[14px] border border-border bg-surface p-7 shadow-float sm:p-9">
        <span className="grid size-11 place-items-center rounded-[11px] bg-brand text-sm font-bold text-white">
          CO
        </span>
        <p className="admin-kicker mt-7 text-brand">CareerOS nội bộ</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
          Đăng nhập
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Dùng tài khoản được cấp cho Candidate, HR hoặc Admin.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold text-ink"
            >
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-[9px] border border-danger/20 bg-danger/[0.04] px-3 py-2 text-xs leading-5 text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            <LogIn className="size-4" />
            Đăng nhập
          </Button>
        </form>
      </section>
    </main>
  );
}
