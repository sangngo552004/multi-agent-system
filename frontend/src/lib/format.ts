import { format, formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";

const integerFormatter = new Intl.NumberFormat("vi-VN");

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy") {
  return format(new Date(value), pattern, { locale: vi });
}

export function formatRelativeTime(value: string | Date) {
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: vi,
  });
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
