interface KanbanColumnProps {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ label, count, children }: KanbanColumnProps) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-lg"
      style={{
        backgroundColor: "var(--neutral-30)",
      }}
    >
      <div
        className="gap-base px-sm py-base flex items-center border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-body text-highlight-10 font-semibold">{label}</span>
        <span className="px-base py-xs text-body bg-neutral-30 text-highlight-10 rounded-full font-medium">
          {count}
        </span>
      </div>

      <div className="gap-base p-base flex flex-1 flex-col">{children}</div>
    </div>
  );
}
