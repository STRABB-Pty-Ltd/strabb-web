"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanCardProps {
  id: string;
  borderColor: string;
  children: React.ReactNode;
}

export function KanbanCard({ id, borderColor, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isDragging ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
      className="cursor-grab rounded-lg bg-white active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div style={{ padding: "var(--space-sm) var(--space-md)" }}>{children}</div>
    </div>
  );
}
