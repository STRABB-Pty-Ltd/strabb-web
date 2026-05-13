import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Compact variant - smaller padding, no icon. Use inside narrow containers. */
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-md gap-xs" : "py-xl gap-sm"
      }`}
    >
      {!compact && Icon && (
        <Icon
          size={34}
          className="opacity-40"
          style={{ color: "var(--highlight-10)" }}
          aria-hidden="true"
        />
      )}
      <p className="text-body font-medium" style={{ color: "var(--highlight-10)" }}>
        {title}
      </p>
      {description && <p className="text-body text-highlight-10 max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-xs" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
