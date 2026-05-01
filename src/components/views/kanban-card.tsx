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
      className="rounded-lg bg-white transition-shadow hover:shadow-md"
    >
      <div style={{ padding: "var(--space-sm) var(--space-md)" }}>{children}</div>
    </div>
  );
}
