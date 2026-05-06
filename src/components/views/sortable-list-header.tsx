"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import {
  ColumnFilterDropdown,
  type ColumnFilterConfig,
} from "./column-filter-dropdown";

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  /** When provided, the column header becomes a filter dropdown trigger. */
  filter?: ColumnFilterConfig;
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
      style={{ borderColor: "var(--border)", minHeight: "var(--space-lg)" }}
    >
      {columns.map((col) => {
        const isSortable = col.sortable !== false && !col.filter;
        const isActive = isSortable && sortKey === col.key;
        const ariaSort: "ascending" | "descending" | "none" | undefined = isSortable
          ? isActive
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
          : undefined;
        return (
          <div
            key={col.key}
            role="columnheader"
            aria-sort={ariaSort}
            className="px-sm py-sm text-body flex min-w-0 items-center font-semibold tracking-wide text-gray-500 uppercase"
            style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
          >
            {col.filter ? (
              <ColumnFilterDropdown label={col.label} filter={col.filter} />
            ) : isSortable ? (
              <button
                type="button"
                onClick={() => onSort(col.key)}
                className="gap-xs flex items-center hover:text-gray-700"
              >
                {col.label}
                {isActive ? (
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
        );
      })}
    </div>
  );
}
