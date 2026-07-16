"use client";

import { useRef, type ReactNode } from "react";

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
  /** Rendered above the column header, inside the same sticky block (e.g. a
   *  mobile-only timeframe stepper + Today button). Optional. */
  stickyHeaderExtra?: ReactNode;
}

export function SortableList<T>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  getRowId,
  stickyHeaderExtra,
}: SortableListProps<T>) {
  // Columns are a fixed-width flex row (920px+ summed across all seven) that
  // used to just clip past the outer overflow-hidden border with no way to
  // reach it - on a 375px phone that left only Listing + partial Guest
  // visible, so there was no way to see a booking's date at all (found in
  // the M.4 mobile audit). The body's overflow-x-auto lets rows scroll
  // horizontally; the header mirrors that scroll position (see
  // syncHeaderScroll) instead of sharing the same scroll container.
  //
  // The header used to just be the body's first child inside one shared
  // overflow-x-auto div. position: sticky can't reach past ANY ancestor
  // with non-visible overflow to find Canvas's page-level scroll (verified
  // empirically - a sticky header nested in that div just scrolled away
  // with everything else, since the overflow-x-auto div itself became its
  // sticky containing block instead of Canvas, and never actually scrolls
  // vertically). So the header now lives in its own sibling block: sticky
  // (with a clear path up to Canvas - no overflow-hidden ancestor between
  // here and there), overflow-x-hidden with its scrollLeft driven
  // programmatically to track the body's real horizontal scroll.
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const syncHeaderScroll = () => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };

  return (
    <div>
      {/* marginTop/top cancel Canvas's own padding-top the same way the
          calendar gantt/agenda/list control bars do - see calendar-agenda-
          view's comment for why both are needed (top alone only closes the
          gap once scrolling has actually engaged the sticky behaviour).
          marginBottom: -2px makes the sticky block's flow-reserved space
          end 2px above its own (unchanged) painted bottom edge, so it
          always overlaps the scrolling body by a couple of px instead of
          trying to land the two flush at exactly 0 - this viewport renders
          at a fractional pixel ratio (getBoundingClientRect values come
          back as e.g. 172.333...), and the sticky header (its own
          positioning system) and the body (normal scroll) rounded to
          different sub-pixels, leaving a hairline of the page background
          visible right at the seam on some scroll positions. Deliberate
          overlap is robust to that; trying to align exactly isn't. */}
      <div
        data-slot="sortable-list-sticky-header"
        className="pt-xs sticky"
        style={{
          top: "calc(-1 * (var(--space-md) - 2px))",
          marginTop: "calc(-1 * (var(--space-md) - 2px))",
          marginBottom: "-2px",
          zIndex: 10,
          backgroundColor: "var(--surface-60)",
        }}
      >
        {stickyHeaderExtra}
        <div
          ref={headerScrollRef}
          className="overflow-x-hidden rounded-t-lg border-t border-r border-l"
          style={{ borderColor: "var(--border)" }}
        >
          <SortableListHeader
            columns={columns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
        </div>
      </div>
      <div
        ref={bodyScrollRef}
        className="overflow-x-auto rounded-b-lg border-r border-b border-l"
        style={{ borderColor: "var(--border)" }}
        onScroll={syncHeaderScroll}
      >
        <div>
          {data.length === 0 && <EmptyState icon={Inbox} title="No items to display" />}
          {data.map((item, index) => (
            <SortableListRow
              key={getRowId(item)}
              id={getRowId(item)}
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
