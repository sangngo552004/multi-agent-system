"use client";

import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={8}
        align="end"
        className={cn(
          "z-50 min-w-52 rounded-[10px] border border-border bg-surface p-1.5 shadow-float",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-[7px] px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-soft",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = DropdownPrimitive.Separator;
