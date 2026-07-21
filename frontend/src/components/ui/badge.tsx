import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "brand" | "signal" | "info" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-soft text-muted",
  brand: "border-brand/15 bg-brand/8 text-brand",
  signal: "border-signal bg-signal/35 text-ink",
  info: "border-info/20 bg-info/8 text-info",
  success: "border-success/20 bg-success/8 text-success",
  warning: "border-warning/20 bg-warning/8 text-warning",
  danger: "border-danger/20 bg-danger/8 text-danger",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
