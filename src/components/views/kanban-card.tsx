interface KanbanCardProps {
  borderColor: string;
  children: React.ReactNode;
}

export function KanbanCard({ borderColor, children }: KanbanCardProps) {
  return (
    <div
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
      className="rounded-lg bg-white"
    >
      <div style={{ padding: "var(--space-sm) var(--space-md)" }}>{children}</div>
    </div>
  );
}
