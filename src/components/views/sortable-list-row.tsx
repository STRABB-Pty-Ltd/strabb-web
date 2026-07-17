"use client";

import type { CSSProperties } from "react";

import type { ColumnDef } from "./sortable-list-header";

interface SortableListRowProps<T> {
  item: T;
  columns: ColumnDef<T>[];
  index: number;
  onClick: () => void;
  /** Same id as getRowId(item) - lets a caller find and scroll to this
   *  specific row (e.g. a "Today" shortcut) without threading refs through
   *  the generic list. */
  id?: string;
}

export function SortableListRow<T>({ item, columns, index, onClick, id }: SortableListRowProps<T>) {
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "var(--surface-60)" : "var(--neutral-30)";
  const rowAlt = isEven ? "var(--neutral-30)" : "var(--surface-60)";

  return (
    <button
      type="button"
      data-row-id={id}
      onClick={onClick}
      // w-full alone caps at the scroll container's visible width (its
      // containing block), not the summed column width - the fixed-width
      // columns below then overflow it silently, so the row's own
      // background stopped a few hundred px short of where the horizontal
      // scroll actually ends. min-w-max forces the row at least as wide as
      // its content requires, so the background always reaches exactly as
      // far as the scrollable columns do.
      className="hover:bg-neutral-30/50 flex w-full min-w-max text-left transition-colors"
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
          className="px-sm text-body text-highlight-10 flex min-w-0 items-center whitespace-nowrap"
          style={{ width: col.width ?? "1fr", flex: col.width ? `0 0 ${col.width}` : 1 }}
        >
          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
        </div>
      ))}
    </button>
  );
}
