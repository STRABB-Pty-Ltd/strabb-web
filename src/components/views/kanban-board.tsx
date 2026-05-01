import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";

export interface KanbanBoardProps<T> {
  columns: { id: string; label: string; items: T[] }[];
  renderCard: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  getBorderColor: (item: T) => string;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  getItemId,
  getBorderColor,
}: KanbanBoardProps<T>) {
  return (
    <div
      className="no-scrollbar overflow-auto"
      // 233 = next Fibonacci step beyond --space-xl, design-locked.
      style={{ maxHeight: "calc(100vh - 233px)" }}
    >
      <div className="gap-sm pb-sm flex">
        {columns.map((col) => (
          <KanbanColumn key={col.id} id={col.id} label={col.label} count={col.items.length}>
            {col.items.map((item) => (
              <KanbanCard key={getItemId(item)} borderColor={getBorderColor(item)}>
                {renderCard(item)}
              </KanbanCard>
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}
