import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* The shared chip/pill primitive. Renders a <span>; interactive call
   sites (submenu chips, billing nav pill, triage pills, toggle segments)
   keep their own <button>/<Link> element and compose chipVariants
   directly, the same way buttonVariants is consumed.
   Colour-driven tones (solid/tint/ghost) take a runtime `color` because
   channel/status colours are data-driven - callers pass the resolved
   token, the primitive never embeds the channel/status maps. */

const chipVariants = cva(
  "gap-xs text-body inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-30 text-highlight-10",
        surface: "bg-surface-60 text-highlight-10",
        accent: "bg-highlight-10 text-surface-60",
        outline: "border-neutral-30 text-highlight-10 hover:bg-neutral-30 border",
        solid: "text-text-on-color",
        tint: "",
        ghost: "",
      },
      size: {
        xs: "px-xs py-xs",
        sm: "px-base py-xs",
        md: "px-sm py-xs",
        lg: "px-sm py-base h-[var(--chip-height)]",
      },
      radius: {
        sm: "rounded-sm",
        md: "rounded-md",
        chip: "rounded-[var(--chip-radius)]",
        pill: "rounded-full",
      },
      interactive: {
        true: "focus-visible:ring-ring/50 cursor-pointer transition-all outline-none select-none hover:opacity-80 focus-visible:ring-3 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
      radius: "md",
      interactive: false,
    },
  },
);

type ChipProps = Omit<React.ComponentProps<"span">, "color"> &
  VariantProps<typeof chipVariants> & {
    /** Driving colour for the solid/tint/ghost tones (a resolved token,
     *  e.g. "var(--channel-airbnb)" or "var(--status-completed)"). */
    color?: string;
    /** Foreground override; solid defaults to --text-on-color, tint to `color`. */
    textColor?: string;
  };

function Chip({
  className,
  tone = "neutral",
  size,
  radius,
  interactive,
  color,
  textColor,
  style,
  ...props
}: ChipProps) {
  let toneStyle: React.CSSProperties | undefined;
  if (color) {
    if (tone === "solid") {
      toneStyle = { backgroundColor: color, ...(textColor ? { color: textColor } : {}) };
    } else if (tone === "tint") {
      toneStyle = {
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        color: textColor ?? color,
      };
    } else if (tone === "ghost") {
      toneStyle = { color: textColor ?? color };
    }
  }
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ tone, size, radius, interactive, className }))}
      style={{ ...toneStyle, ...style }}
      {...props}
    />
  );
}

export { Chip, chipVariants };
