"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ColumnFilterDropdown, type ColumnFilterConfig } from "./column-filter-dropdown";

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
      className="bg-neutral-30 flex border-b"
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
            className="px-sm py-sm text-body text-highlight-10 flex min-w-0 items-center font-semibold tracking-wide uppercase"
            style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
          >
            {col.filter ? (
              <ColumnFilterDropdown label={col.label} filter={col.filter} />
            ) : isSortable ? (
              <Button
                type="button"
                variant="quiet"
                size="xs"
                onClick={() => onSort(col.key)}
                className="px-0 font-semibold"
              >
                {col.label}
                {isActive ? (
                  sortDirection === "asc" ? (
                    <ArrowUp size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={12} aria-hidden="true" />
                  )
                ) : (
                  <ArrowUpDown size={12} className="opacity-30" />
                )}
              </Button>
            ) : (
              col.label
            )}
          </div>
        );
      })}
    </div>
  );
}
