"use client";

import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

import { SortableListHeader, type ColumnDef } from "./sortable-list-header";
import { SortableListRow } from "./sortable-list-row";

export type { ColumnDef };

export interface SortableListProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  onRowClick: (item: T) => void;
  getRowId: (item: T) => string;
}

export function SortableList<T>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  getRowId,
}: SortableListProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <SortableListHeader
        columns={columns}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={onSort}
      />
      <div>
        {data.length === 0 && <EmptyState icon={Inbox} title="No items to display" />}
        {data.map((item, index) => (
          <SortableListRow
            key={getRowId(item)}
            item={item}
            columns={columns}
            index={index}
            onClick={() => onRowClick(item)}
          />
        ))}
      </div>
    </div>
  );
}
