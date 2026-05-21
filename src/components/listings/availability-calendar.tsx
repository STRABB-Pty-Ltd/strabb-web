"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useListingStateAPI,
  useUpdateListingAvailability,
} from "@/lib/api-hooks/listing-state-api";
import type { DailyListingStateResponse } from "@/lib/schemas/listing-state";
import { useAppStore } from "@/stores/app-store";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_OPTS = { weekStartsOn: 1 as const };
const DEFAULT_AVAILABILITY = 1;

interface AvailabilityCalendarProps {
  listingId: string;
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Availability editor — the third (and simplest) per-listing calendar.
 * Cells show the bookable-units count; click to edit. The booking-
 * driven decrement from F.6 already lands rows in `daily_listing_state`
 * for confirmed reservations, so this surface is mostly for manual
 * blocks (count=0) or opening multi-unit listings (count >= 2).
 */
export function AvailabilityCalendar({ listingId }: AvailabilityCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selection, setSelection] = useState<{ anchor: string; head: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [countInput, setCountInput] = useState("");
  const [countError, setCountError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const stateQuery = useListingStateAPI(listingId, toIsoDate(gridStart), toIsoDate(gridEnd));
  const updateAvailability = useUpdateListingAvailability();

  const rowsByDate = useMemo(() => {
    const m = new Map<string, DailyListingStateResponse>();
    for (const row of stateQuery.data ?? []) {
      m.set(row.date, row);
    }
    return m;
  }, [stateQuery.data]);

  const cellsInSelection = (sel: { anchor: string; head: string }) => {
    const [a, b] = [sel.anchor, sel.head].sort();
    return { from: a, to: b };
  };

  const isCellSelected = (iso: string): boolean => {
    if (!selection) return false;
    const { from, to } = cellsInSelection(selection);
    return iso >= from && iso <= to;
  };

  const handleCellClick = (day: Date, shiftKey: boolean) => {
    const iso = toIsoDate(day);
    if (shiftKey && selection) {
      setSelection({ anchor: selection.anchor, head: iso });
    } else {
      setSelection({ anchor: iso, head: iso });
    }
  };

  const openEditFromSelection = () => {
    if (!selection) return;
    const isSingle = selection.anchor === selection.head;
    if (isSingle) {
      const row = rowsByDate.get(selection.anchor);
      setCountInput(String(row?.availabilityCount ?? DEFAULT_AVAILABILITY));
    } else {
      setCountInput("");
    }
    setCountError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!selection) return;
    const parsed = Number(countInput);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1000) {
      setCountError("Enter a whole number from 0 to 1000");
      return;
    }
    const { from, to } = cellsInSelection(selection);
    try {
      await updateAvailability.mutateAsync({
        listingId,
        body:
          from === to
            ? { date: from, count: parsed }
            : { dateFrom: from, dateTo: to, count: parsed },
      });
      addToast({ type: "success", message: "Availability updated" });
      setEditOpen(false);
      setSelection(null);
    } catch (err) {
      setCountError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <div className="gap-base flex items-center">
          <button
            type="button"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="hover:bg-neutral-30 h-md inline-flex w-md items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="text-subheading font-semibold">{format(viewDate, "MMMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="hover:bg-neutral-30 h-md inline-flex w-md items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            aria-label="Next month"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!selection}
          onClick={openEditFromSelection}
        >
          {selection && selection.anchor !== selection.head ? "Edit range" : "Edit"}
        </Button>
      </div>

      <p className="text-body" style={{ color: "var(--text-secondary)" }}>
        Each cell shows the bookable units for that date. Set 0 to block a date, or 2+ to open
        multi-unit availability. The default is 1; confirmed bookings auto-decrement this number.
      </p>

      <div className="gap-xs grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-body text-center" style={{ color: "var(--text-secondary)" }}>
            {d}
          </div>
        ))}
      </div>

      <div className="gap-xs grid grid-cols-7">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const row = rowsByDate.get(iso);
          const inMonth = isSameMonth(day, viewDate);
          const isSelected = isCellSelected(iso);
          const count = row?.availabilityCount ?? DEFAULT_AVAILABILITY;
          const isBlocked = count === 0;
          const today = isToday(day);

          let bg: string | undefined = undefined;
          let fg: string = inMonth ? "var(--highlight-10)" : "var(--neutral-30)";
          if (isSelected) {
            bg = "var(--highlight-10)";
            fg = "var(--surface-60)";
          } else if (isBlocked) {
            bg = "var(--status-danger)";
            fg = "var(--status-danger-fg)";
          } else if (today) {
            bg = "var(--neutral-30)";
          }

          return (
            <button
              key={iso}
              type="button"
              onClick={(e) => handleCellClick(day, e.shiftKey)}
              onDoubleClick={() => {
                handleCellClick(day, false);
                openEditFromSelection();
              }}
              className="text-body min-h-[64px] rounded p-1 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: fg, backgroundColor: bg, opacity: inMonth ? 1 : 0.5 }}
              aria-pressed={isSelected}
              aria-label={`${format(day, "PPP")}, ${count} bookable unit${count === 1 ? "" : "s"}`}
            >
              <div className="text-xs font-semibold">{day.getDate()}</div>
              <div
                className="mt-1 text-xs"
                style={{
                  color: isSelected
                    ? "var(--surface-60)"
                    : isBlocked
                      ? "var(--status-danger-fg)"
                      : "var(--text-secondary)",
                  fontWeight: row != null ? 600 : 400,
                }}
              >
                {isBlocked ? "Blocked" : `${count} unit${count === 1 ? "" : "s"}`}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selection && selection.anchor !== selection.head
                ? "Edit availability for date range"
                : "Edit availability"}
            </DialogTitle>
            <DialogDescription>
              {selection
                ? selection.anchor === selection.head
                  ? format(new Date(selection.anchor), "PPP")
                  : `${format(new Date(cellsInSelection(selection).from), "PPP")} → ${format(
                      new Date(cellsInSelection(selection).to),
                      "PPP",
                    )}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-sm">
            <Label htmlFor="availability-count">Bookable units</Label>
            <Input
              id="availability-count"
              type="number"
              inputMode="numeric"
              min={0}
              max={1000}
              step="1"
              value={countInput}
              onChange={(e) => {
                setCountInput(e.target.value);
                if (countError) setCountError(null);
              }}
              autoFocus
            />
            <p className="text-body" style={{ color: "var(--text-secondary)" }}>
              0 blocks the date entirely. The default is 1.
            </p>
            {countError && (
              <p className="text-body" style={{ color: "var(--status-danger)" }}>
                {countError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateAvailability.isPending}>
              {updateAvailability.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
