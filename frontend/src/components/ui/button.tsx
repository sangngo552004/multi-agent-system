"use client";

import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover",
  secondary: "border-border-strong bg-surface text-ink hover:bg-surface-soft",
  ghost: "border-transparent bg-transparent text-muted hover:bg-surface-soft hover:text-ink",
  danger: "border-danger bg-danger text-white hover:bg-[#a93931]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "size-10 p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  asChild,
  className,
  children,
  disabled,
  loading,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Slot : "button";

  return (
    <Component
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[9px] border font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Component>
  );
}
