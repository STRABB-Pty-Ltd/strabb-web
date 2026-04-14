"use client";

import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";

export interface KanbanBoardProps<T> {
  columns: { id: string; label: string; items: T[] }[];
  renderCard: (item: T) => React.ReactNode;
  onDragEnd: (result: { itemId: string; sourceColumn: string; targetColumn: string }) => void;
  getItemId: (item: T) => string;
  getBorderColor: (item: T) => string;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  onDragEnd,
  getItemId,
  getBorderColor,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find source column
    const sourceCol = columns.find((col) =>
      col.items.some((item) => getItemId(item) === activeId),
    );
    // The over target could be a column ID or another card ID
    let targetCol = columns.find((col) => col.id === overId);
    if (!targetCol) {
      targetCol = columns.find((col) => col.items.some((item) => getItemId(item) === overId));
    }

    if (sourceCol && targetCol && sourceCol.id !== targetCol.id) {
      onDragEnd({
        itemId: activeId,
        sourceColumn: sourceCol.id,
        targetColumn: targetCol.id,
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const itemIds = col.items.map(getItemId);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              count={col.items.length}
              itemIds={itemIds}
            >
              {col.items.map((item) => (
                <KanbanCard key={getItemId(item)} id={getItemId(item)} borderColor={getBorderColor(item)}>
                  {renderCard(item)}
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
