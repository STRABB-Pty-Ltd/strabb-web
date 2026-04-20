"use client";

import type { ColumnDef } from "./sortable-list-header";

interface SortableListRowProps<T> {
  item: T;
  columns: ColumnDef<T>[];
  index: number;
  onClick: () => void;
}

export function SortableListRow<T>({ item, columns, index, onClick }: SortableListRowProps<T>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full text-left transition-colors hover:bg-blue-50/50"
      style={{
        height: 55,
        backgroundColor: index % 2 === 0 ? "var(--surface-60)" : "var(--neutral-30)",
      }}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className="px-sm text-body flex items-center truncate text-gray-700"
          style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
        >
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
        </div>
      ))}
    </button>
  );
}
