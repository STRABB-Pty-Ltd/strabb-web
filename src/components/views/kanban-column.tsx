"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
  itemIds: string[];
}

export function KanbanColumn({ id, label, count, children, itemIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className="flex shrink-0 flex-col rounded-lg"
      style={{
        minWidth: 280,
        backgroundColor: isOver ? "rgba(59, 130, 246, 0.05)" : "#F9FAFB",
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
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  );
}
