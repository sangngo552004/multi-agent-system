import { cn } from "@/lib/cn";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-faint",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function StatusDot({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-ink", className)}>
      <span className={cn("size-2 rounded-full", toneClasses[tone])} aria-hidden />
      {label}
    </span>
  );
}
