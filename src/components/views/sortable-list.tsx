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
  // Columns are a fixed-width flex row (920px+ summed across all seven) that
  // used to just clip past the outer overflow-hidden border with no way to
  // reach it - on a 375px phone that left only Listing + partial Guest
  // visible, so there was no way to see a booking's date at all (found in
  // the M.4 mobile audit). The inner overflow-x-auto lets header + rows
  // scroll together while the outer border/rounded corners stay put.
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
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
    </div>
  );
}
