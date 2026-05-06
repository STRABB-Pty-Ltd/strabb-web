interface KanbanCardProps {
  borderColor: string;
  children: React.ReactNode;
}

export function KanbanCard({ borderColor, children }: KanbanCardProps) {
  // Hoist the keyboard focus ring to the visual card wrapper so the inner
  // button's outline doesn't paint a chunky frame inside the card padding.
  // The descendant button suppresses its own outline via the [&_button]
  // selector below, and we light up the wrapper when any descendant has
  // :focus-visible (keyboard focus only, not mouse).
  return (
    <div
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
      className="has-[:focus-visible]:ring-ring rounded-lg bg-surface-60 transition-shadow hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2 [&_button:focus-visible]:outline-none"
    >
      <div style={{ padding: "var(--space-sm) var(--space-md)" }}>{children}</div>
    </div>
  );
}
