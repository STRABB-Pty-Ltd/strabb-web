import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an enum-shaped string (e.g. status "in_progress", priority "high")
 * for display: underscores to spaces, first letter capitalised.
 */
export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return "";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
