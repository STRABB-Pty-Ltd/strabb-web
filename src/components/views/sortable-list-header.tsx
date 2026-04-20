"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface SortableListHeaderProps<T> {
  columns: ColumnDef<T>[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
}

export function SortableListHeader<T>({
  columns,
  sortKey,
  sortDirection,
  onSort,
}: SortableListHeaderProps<T>) {
  return (
    <div
      className="flex border-b bg-gray-50"
      style={{ borderColor: "var(--border)", minHeight: 34 }}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className="px-sm text-body flex items-center font-semibold tracking-wide text-gray-500 uppercase"
          style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
        >
          {col.sortable !== false ? (
            <button
              type="button"
              onClick={() => onSort(col.key)}
              className="gap-xs flex items-center hover:text-gray-700"
            >
              {col.label}
              {sortKey === col.key ? (
                sortDirection === "asc" ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                )
              ) : (
                <ArrowUpDown size={12} className="opacity-30" />
              )}
            </button>
          ) : (
            col.label
          )}
        </div>
      ))}
    </div>
  );
}
