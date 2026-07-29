import type { SortingState } from "@tanstack/react-table";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

export function readIdFilter(value: string | null) {
  return value && UUID_PATTERN.test(value) ? value : "ALL";
}

export function readPageIndex(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000
    ? page - 1
    : 0;
}

export function readSorting(
  value: string | null,
  allowedFields: readonly string[],
  fallbackField: string,
  fallbackDirection: "asc" | "desc" = "desc",
): SortingState {
  const [requestedField, requestedDirection] = value?.split(",", 2) ?? [];
  const id = allowedFields.includes(requestedField)
    ? requestedField
    : fallbackField;
  const direction =
    requestedDirection === "asc" || requestedDirection === "desc"
      ? requestedDirection
      : fallbackDirection;
  return [{ id, desc: direction === "desc" }];
}
