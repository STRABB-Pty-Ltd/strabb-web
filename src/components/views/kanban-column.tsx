interface KanbanColumnProps {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, label, count, children }: KanbanColumnProps) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-lg"
      style={{
        backgroundColor: "var(--neutral-30)",
      }}
    >
      <div
        className="flex items-center gap-base border-b px-sm py-base"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-body font-semibold text-gray-700">{label}</span>
        <span className="rounded-full bg-gray-200 px-base py-xs text-body font-medium text-gray-600">
          {count}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-base p-base">{children}</div>
    </div>
  );
}
