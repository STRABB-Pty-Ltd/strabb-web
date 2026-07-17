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
          Both go 2px past the exact cancel-out point (-space-md instead of
          -(space-md - 2px)) deliberately: exact-matching two independently
          -rounded calc() results was still leaving a hairline gap on at
          least one real device even though it measured as a clean 0 in
          this environment (sub-pixel snapping isn't guaranteed consistent
          across renderers/DPRs). The extra 2px eats into pt-xs's own 5px
          of padding - Canvas clips AT its own edge, so overshooting is
          only safe because it's invisible padding being clipped, not the
          stepper button itself; 3px of breathing room is left.
          marginBottom: -2px makes the sticky block's flow-reserved space
          end 2px above its own (unchanged) painted bottom edge, so it
          always overlaps the scrolling body by a couple of px instead of
          trying to land the two flush at exactly 0 - same sub-pixel
          mismatch, same fix (deliberate overlap beats exact alignment). */}
      <div
        data-slot="sortable-list-sticky-header"
        className="pt-xs sticky"
        style={{
          top: "calc(-1 * var(--space-md))",
          marginTop: "calc(-1 * var(--space-md))",
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
