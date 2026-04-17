import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-muted border-t-primary h-md w-md animate-spin rounded-full border-2",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
