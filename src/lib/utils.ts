import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* The custom type ladder (text-body/subheading/heading/display) must be
   registered as font-size utilities: stock tailwind-merge classifies an
   unknown text-* class as a text COLOUR, so any variant colour class
   (text-highlight-10, text-text-on-color) merged after it silently strips
   the size class and the element falls back to the browser's 16px. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["body", "subheading", "heading", "display"] }],
    },
  },
});

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
