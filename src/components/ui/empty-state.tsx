import type { LucideIcon } from "lucide-react";

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
        <Icon size={34} className="opacity-40" style={{ color: "var(--brand-10)" }} />
      )}
      <p className="text-body font-medium" style={{ color: "var(--brand-10)" }}>
        {title}
      </p>
      {description && <p className="text-body max-w-xs text-gray-500">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-xs px-sm py-base text-body rounded-lg font-medium text-white"
          style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
