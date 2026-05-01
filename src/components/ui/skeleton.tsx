import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pixel height. Use sparingly - prefer Tailwind h-* utilities via className. */
  h?: number;
  /** Pixel width. Use sparingly - prefer w-* utilities via className. */
  w?: number;
}

/**
 * Animated pulsing block. Use to reserve space for async content so the
 * layout doesn't jump on data arrival.
 *
 * Wraps a pulse on `var(--neutral-30)` so it adapts in dark mode the same
 * way as cards do.
 */
export function Skeleton({ className, style, h, w, ...props }: SkeletonProps) {
  return (
    <div
      role="presentation"
      className={cn("animate-pulse rounded-lg bg-[var(--neutral-30)]", className)}
      style={{
        height: h,
        width: w,
        ...style,
      }}
      {...props}
    />
  );
}
