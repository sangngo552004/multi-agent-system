"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/services/http/api-client";
import Link from "next/link";

export function RegisterClient() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/auth/register", {
        fullName,
        email,
        password,
        role: "CANDIDATE",
      }, { authenticated: false });

      setIsSuccess(true);
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
        <section className="w-full max-w-md rounded-[14px] border border-border bg-surface p-7 shadow-float sm:p-9 text-center">
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
            Đăng ký thành công!
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Một email xác thực đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hòm thư của bạn để kích hoạt tài khoản.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push("/vi/login")}>
            Đến trang Đăng nhập
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
      <section className="w-full max-w-md rounded-[14px] border border-border bg-surface p-7 shadow-float sm:p-9">
        <span className="grid size-11 place-items-center rounded-[11px] bg-brand text-sm font-bold text-white">
          CO
        </span>
        <h1 className="mt-7 text-3xl font-semibold tracking-[-0.04em] text-ink">
          Tạo tài khoản ứng viên
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Điền thông tin bên dưới để bắt đầu hành trình sự nghiệp.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="mb-2 block text-xs font-semibold text-ink">
              Họ và tên
            </label>
            <Input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UserPlus className="size-4 mr-2" />}
            Đăng ký
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Đã có tài khoản?{" "}
          <Link href="/vi/login" className="text-brand font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    </main>
  );
}
