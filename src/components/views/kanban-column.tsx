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
        backgroundColor: "#F9FAFB",
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {count}
        </span>
      </div>

      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {children}
      </div>
    </div>
  );
}
