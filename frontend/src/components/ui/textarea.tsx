import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-[9px] border border-border-strong bg-surface px-3 py-2.5 text-sm leading-6 text-ink placeholder:text-faint transition-colors hover:border-muted focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-soft",
        className,
      )}
      {...props}
    />
  );
}
