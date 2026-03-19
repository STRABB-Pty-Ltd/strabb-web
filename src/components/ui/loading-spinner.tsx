import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-muted border-t-primary h-6 w-6 animate-spin rounded-full border-2",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
