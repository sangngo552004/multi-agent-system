import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-faint transition-colors hover:border-muted focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-faint",
        className,
      )}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
        aria-hidden
      />
      <Input type="search" className="pl-9" {...props} />
    </div>
  );
}
