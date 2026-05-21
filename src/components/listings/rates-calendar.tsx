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
import { useListingStateAPI, useUpdateListingRates } from "@/lib/api-hooks/listing-state-api";
import type { DailyListingStateResponse } from "@/lib/schemas/listing-state";
import { useAppStore } from "@/stores/app-store";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_OPTS = { weekStartsOn: 1 as const };

interface RatesCalendarProps {
  listingId: string;
  /** Listing's base nightly rate — shown as the cell value when no
   *  per-date override exists. May be null if the host never set one. */
  baseNightlyRate: number | null;
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function RatesCalendar({ listingId, baseNightlyRate }: RatesCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  // Selection state — null = nothing selected; { anchor, head } describes
  // a range (single cell when anchor == head).
  const [selection, setSelection] = useState<{ anchor: string; head: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  // Visible window: pad to the full grid-start/grid-end so the query
  // covers every cell we render (including out-of-month days from
  // neighbours). Avoids needing two queries when the visible grid
  // straddles a month boundary.
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const stateQuery = useListingStateAPI(listingId, toIsoDate(gridStart), toIsoDate(gridEnd));
  const updateRates = useUpdateListingRates();

  // Index per-date overrides for O(1) cell lookup.
  const ratesByDate = useMemo(() => {
    const m = new Map<string, DailyListingStateResponse>();
    for (const row of stateQuery.data ?? []) {
      m.set(row.date, row);
    }
    return m;
  }, [stateQuery.data]);

  // ---- selection helpers --------------------------------------------

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
      // Extend the existing selection.
      setSelection({ anchor: selection.anchor, head: iso });
    } else {
      setSelection({ anchor: iso, head: iso });
    }
  };

  const openEditFromSelection = () => {
    if (!selection) return;
    const { from } = cellsInSelection(selection);
    // Pre-fill the input with the current override (if a single date)
    // or blank for ranges (multi-date may have mixed values).
    const single = selection.anchor === selection.head;
    const existing = single ? ratesByDate.get(from)?.rate : null;
    setRateInput(existing != null ? existing.toString() : "");
    setRateError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!selection) return;
    const parsed = Number(rateInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setRateError("Enter a non-negative number");
      return;
    }
    const { from, to } = cellsInSelection(selection);
    try {
      await updateRates.mutateAsync({
        listingId,
        body:
          from === to ? { date: from, rate: parsed } : { dateFrom: from, dateTo: to, rate: parsed },
      });
      addToast({ type: "success", message: "Rates updated" });
      setEditOpen(false);
      setSelection(null);
    } catch (err) {
      setRateError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // ---- render -------------------------------------------------------

  const formatRate = (n: number | null): string =>
    n == null
      ? "—"
      : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        Click a date to select it; shift-click another to extend the range, then choose Edit. Cells
        without an override show the listing&apos;s default nightly rate in grey.
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
          const row = ratesByDate.get(iso);
          const inMonth = isSameMonth(day, viewDate);
          const isSelected = isCellSelected(iso);
          const hasOverride = row?.rate != null;
          const displayedRate = hasOverride ? row?.rate : baseNightlyRate;
          const today = isToday(day);

          let bg: string | undefined = undefined;
          let fg: string = inMonth ? "var(--highlight-10)" : "var(--neutral-30)";
          if (isSelected) {
            bg = "var(--highlight-10)";
            fg = "var(--surface-60)";
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
              aria-label={`${format(day, "PPP")}${
                displayedRate != null ? `, rate $${formatRate(displayedRate)}` : ", no rate set"
              }`}
            >
              <div className="text-xs font-semibold">{day.getDate()}</div>
              <div
                className="mt-1 text-xs"
                style={{
                  color: isSelected
                    ? "var(--surface-60)"
                    : hasOverride
                      ? "var(--highlight-10)"
                      : "var(--text-secondary)",
                  fontWeight: hasOverride ? 600 : 400,
                }}
              >
                {displayedRate != null ? `$${formatRate(displayedRate)}` : "—"}
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
                ? "Edit rate for date range"
                : "Edit rate"}
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
            <Label htmlFor="rate-input">Nightly rate (AUD)</Label>
            <Input
              id="rate-input"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={rateInput}
              onChange={(e) => {
                setRateInput(e.target.value);
                if (rateError) setRateError(null);
              }}
              autoFocus
            />
            {rateError && (
              <p className="text-body" style={{ color: "var(--status-danger)" }}>
                {rateError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateRates.isPending}>
              {updateRates.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
