"use client";

import type { CSSProperties } from "react";

import type { ColumnDef } from "./sortable-list-header";

interface SortableListRowProps<T> {
  item: T;
  columns: ColumnDef<T>[];
  index: number;
  onClick: () => void;
}

export function SortableListRow<T>({ item, columns, index, onClick }: SortableListRowProps<T>) {
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "var(--surface-60)" : "var(--neutral-30)";
  const rowAlt = isEven ? "var(--neutral-30)" : "var(--surface-60)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full text-left transition-colors hover:bg-blue-50/50"
      style={
        {
          height: "var(--space-xl)",
          backgroundColor: rowBg,
          "--row-bg": rowBg,
          "--row-alt": rowAlt,
        } as CSSProperties
      }
    >
      {columns.map((col) => (
        <div
          key={col.key}
          // Cells don't clip with overflow:hidden so chips wider than the
          // column don't paint past their own background. Text-heavy renders
          // (e.g. listing names) self-truncate via an inner span. min-w-0
          // overrides flex's default min-width:auto so the cell can shrink
          // below its content's natural size; without it, long text refuses
          // to shrink and pushes neighbouring columns out of alignment.
          className="px-sm text-body flex min-w-0 items-center whitespace-nowrap text-gray-700"
          style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
        >
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
        </div>
      ))}
    </button>
  );
}
