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
  useUpdateListingRates,
  useUpdateListingRestrictions,
} from "@/lib/api-hooks/listing-state-api";
import type {
  DailyListingStateResponse,
  RestrictionsUpdateRequest,
} from "@/lib/schemas/listing-state";
import { useAppStore } from "@/stores/app-store";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_OPTS = { weekStartsOn: 1 as const };
const DEFAULT_AVAILABILITY = 1;

interface ListingCalendarProps {
  listingId: string;
  /** Listing-level base nightly rate. Shown in cells without a per-date
   *  override and used as the dialog's pre-fill for new dates. */
  baseNightlyRate: number | null;
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Tri-state for the boolean restriction fields in the edit dialog:
 *   "unchanged" — omit from the payload (don't touch existing value)
 *   "on" / "off" — set to true / false
 */
type BoolTri = "unchanged" | "on" | "off";

interface EditFormState {
  rate: string;
  count: string;
  minStay: string;
  maxStay: string;
  closedToArrival: BoolTri;
  closedToDeparture: BoolTri;
  stopSell: BoolTri;
}

const EMPTY_FORM: EditFormState = {
  rate: "",
  count: "",
  minStay: "",
  maxStay: "",
  closedToArrival: "unchanged",
  closedToDeparture: "unchanged",
  stopSell: "unchanged",
};

/**
 * Unified per-listing calendar — replaces the separate Rates,
 * Restrictions, and Availability tabs. Each cell shows the date's rate
 * as the primary value, restriction icons as small badges, and the
 * bookable-unit count as a number dot. Selecting a date (or shift-click
 * for a range) and hitting Edit opens one dialog with all three
 * concerns; on save we fan out to the existing per-concern PATCH
 * endpoints in parallel and the worker's rolling debounce coalesces
 * them into a single combined Channex push.
 */
export function ListingCalendar({ listingId, baseNightlyRate }: ListingCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selection, setSelection] = useState<{ anchor: string; head: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const updateRates = useUpdateListingRates();
  const updateRestrictions = useUpdateListingRestrictions();
  const updateAvailability = useUpdateListingAvailability();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const stateQuery = useListingStateAPI(listingId, toIsoDate(gridStart), toIsoDate(gridEnd));

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

  // Pre-fill for single-cell selection so "tweak this one date" feels
  // natural. For ranges, leave everything blank/"unchanged" since the
  // dates may disagree on every field.
  const openEditFromSelection = () => {
    if (!selection) return;
    const isSingle = selection.anchor === selection.head;
    if (isSingle) {
      const row = rowsByDate.get(selection.anchor);
      setForm({
        rate: row?.rate != null ? String(row.rate) : "",
        count: String(row?.availabilityCount ?? DEFAULT_AVAILABILITY),
        minStay: row?.minStay != null ? String(row.minStay) : "",
        maxStay: row?.maxStay != null ? String(row.maxStay) : "",
        closedToArrival: row ? (row.closedToArrival ? "on" : "off") : "unchanged",
        closedToDeparture: row ? (row.closedToDeparture ? "on" : "off") : "unchanged",
        stopSell: row ? (row.stopSell ? "on" : "off") : "unchanged",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFormError(null);
    setEditOpen(true);
  };

  type ParsedPayload = {
    rate: number | null;
    count: number | null;
    restrictions: Omit<RestrictionsUpdateRequest, "date" | "dateFrom" | "dateTo"> | null;
  };

  const parseForm = (): ParsedPayload | { error: string } => {
    let rate: number | null = null;
    if (form.rate.trim() !== "") {
      const n = Number(form.rate);
      if (!Number.isFinite(n) || n < 0) {
        return { error: "Rate must be a non-negative number" };
      }
      rate = n;
    }

    let count: number | null = null;
    if (form.count.trim() !== "") {
      const n = Number(form.count);
      if (!Number.isInteger(n) || n < 0 || n > 1000) {
        return { error: "Bookable units must be a whole number from 0 to 1000" };
      }
      count = n;
    }

    const restrictions: Omit<RestrictionsUpdateRequest, "date" | "dateFrom" | "dateTo"> = {};
    let hasRestrictionChange = false;
    if (form.minStay.trim() !== "") {
      const n = Number(form.minStay);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return { error: "Min stay must be a whole number from 1 to 365" };
      }
      restrictions.minStay = n;
      hasRestrictionChange = true;
    }
    if (form.maxStay.trim() !== "") {
      const n = Number(form.maxStay);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return { error: "Max stay must be a whole number from 1 to 365" };
      }
      restrictions.maxStay = n;
      hasRestrictionChange = true;
    }
    if (
      restrictions.minStay != null &&
      restrictions.maxStay != null &&
      restrictions.maxStay < restrictions.minStay
    ) {
      return { error: "Max stay must be greater than or equal to min stay" };
    }
    if (form.closedToArrival !== "unchanged") {
      restrictions.closedToArrival = form.closedToArrival === "on";
      hasRestrictionChange = true;
    }
    if (form.closedToDeparture !== "unchanged") {
      restrictions.closedToDeparture = form.closedToDeparture === "on";
      hasRestrictionChange = true;
    }
    if (form.stopSell !== "unchanged") {
      restrictions.stopSell = form.stopSell === "on";
      hasRestrictionChange = true;
    }

    if (rate === null && count === null && !hasRestrictionChange) {
      return { error: "Change at least one field to save" };
    }

    return { rate, count, restrictions: hasRestrictionChange ? restrictions : null };
  };

  const handleSave = async () => {
    if (!selection) return;
    const parsed = parseForm();
    if ("error" in parsed) {
      setFormError(parsed.error);
      return;
    }
    const { from, to } = cellsInSelection(selection);
    const isSingle = from === to;

    // Fire the three PATCH endpoints in parallel. The worker's rolling
    // debounce coalesces the resulting push_ari outbox rows into a
    // single combined Channex POST per endpoint (cert Test 8 pattern).
    const mutations: Promise<unknown>[] = [];
    if (parsed.rate !== null) {
      mutations.push(
        updateRates.mutateAsync({
          listingId,
          body: isSingle
            ? { date: from, rate: parsed.rate }
            : { dateFrom: from, dateTo: to, rate: parsed.rate },
        }),
      );
    }
    if (parsed.count !== null) {
      mutations.push(
        updateAvailability.mutateAsync({
          listingId,
          body: isSingle
            ? { date: from, count: parsed.count }
            : { dateFrom: from, dateTo: to, count: parsed.count },
        }),
      );
    }
    if (parsed.restrictions !== null) {
      mutations.push(
        updateRestrictions.mutateAsync({
          listingId,
          body: {
            ...parsed.restrictions,
            ...(isSingle ? { date: from } : { dateFrom: from, dateTo: to }),
          },
        }),
      );
    }

    try {
      await Promise.all(mutations);
      addToast({ type: "success", message: "Calendar updated" });
      setEditOpen(false);
      setSelection(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const isSaving =
    updateRates.isPending || updateRestrictions.isPending || updateAvailability.isPending;
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
        Click a date to select it; shift-click to extend a range, then choose Edit. The dialog sets
        rate, restrictions, and bookable units in one go — STRABB pushes a combined update to
        Channex.
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
          const today = isToday(day);

          const hasRateOverride = row?.rate != null;
          const displayedRate = hasRateOverride ? row?.rate : baseNightlyRate;
          const count = row?.availabilityCount ?? DEFAULT_AVAILABILITY;
          const isBlocked = count === 0;

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
              className="text-body relative min-h-[88px] rounded p-1 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: fg, backgroundColor: bg, opacity: inMonth ? 1 : 0.5 }}
              aria-pressed={isSelected}
              aria-label={describeCell(day, row, displayedRate, count)}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold">{day.getDate()}</span>
                <AvailabilityDot count={count} selected={isSelected} blocked={isBlocked} />
              </div>
              <div
                className="mt-1 text-xs"
                style={{
                  color: isSelected
                    ? "var(--surface-60)"
                    : isBlocked
                      ? "var(--status-danger-fg)"
                      : hasRateOverride
                        ? "var(--highlight-10)"
                        : "var(--text-secondary)",
                  fontWeight: hasRateOverride ? 600 : 400,
                }}
              >
                {displayedRate != null ? `$${formatRate(displayedRate)}` : "—"}
              </div>
              <RestrictionBadges row={row} selected={isSelected} blocked={isBlocked} />
            </button>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selection && selection.anchor !== selection.head
                ? "Edit calendar for date range"
                : "Edit calendar"}
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

          <div className="space-y-md">
            <section className="space-y-sm">
              <h4 className="text-body text-highlight-10 font-semibold">Rate</h4>
              <div>
                <Label htmlFor="rate-input">Nightly rate (AUD)</Label>
                <Input
                  id="rate-input"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="leave blank to keep"
                  value={form.rate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, rate: e.target.value }));
                    if (formError) setFormError(null);
                  }}
                />
              </div>
            </section>

            <section className="space-y-sm">
              <h4 className="text-body text-highlight-10 font-semibold">Availability</h4>
              <div>
                <Label htmlFor="availability-count">Bookable units</Label>
                <Input
                  id="availability-count"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1000}
                  step="1"
                  placeholder="leave blank to keep"
                  value={form.count}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, count: e.target.value }));
                    if (formError) setFormError(null);
                  }}
                />
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                  0 blocks the date; default is 1. Confirmed bookings auto-decrement this.
                </p>
              </div>
            </section>

            <section className="space-y-sm">
              <h4 className="text-body text-highlight-10 font-semibold">Restrictions</h4>
              <div className="gap-sm grid grid-cols-2">
                <div>
                  <Label htmlFor="min-stay-input">Min stay (nights)</Label>
                  <Input
                    id="min-stay-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    step="1"
                    placeholder="leave blank to keep"
                    value={form.minStay}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, minStay: e.target.value }));
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-stay-input">Max stay (nights)</Label>
                  <Input
                    id="max-stay-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    step="1"
                    placeholder="leave blank to keep"
                    value={form.maxStay}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, maxStay: e.target.value }));
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
              </div>

              <TriStateField
                label="Closed to arrival"
                value={form.closedToArrival}
                onChange={(v) => {
                  setForm((f) => ({ ...f, closedToArrival: v }));
                  if (formError) setFormError(null);
                }}
              />
              <TriStateField
                label="Closed to departure"
                value={form.closedToDeparture}
                onChange={(v) => {
                  setForm((f) => ({ ...f, closedToDeparture: v }));
                  if (formError) setFormError(null);
                }}
              />
              <TriStateField
                label="Stop sell"
                value={form.stopSell}
                onChange={(v) => {
                  setForm((f) => ({ ...f, stopSell: v }));
                  if (formError) setFormError(null);
                }}
              />
            </section>

            {formError && (
              <p className="text-body" style={{ color: "var(--status-danger)" }}>
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------

function describeCell(
  day: Date,
  row: DailyListingStateResponse | undefined,
  displayedRate: number | null | undefined,
  count: number,
): string {
  const parts: string[] = [format(day, "PPP")];
  if (displayedRate != null) {
    parts.push(`rate $${displayedRate.toFixed(2)}`);
  }
  parts.push(`${count} bookable unit${count === 1 ? "" : "s"}`);
  if (row?.minStay != null) parts.push(`min stay ${row.minStay}`);
  if (row?.maxStay != null) parts.push(`max stay ${row.maxStay}`);
  if (row?.closedToArrival) parts.push("closed to arrival");
  if (row?.closedToDeparture) parts.push("closed to departure");
  if (row?.stopSell) parts.push("stop sell");
  return parts.join(", ");
}

function AvailabilityDot({
  count,
  selected,
  blocked,
}: {
  count: number;
  selected: boolean;
  blocked: boolean;
}) {
  // Don't render the dot for the default value of 1 — it's noise.
  // The "blocked" case is already conveyed by the cell background.
  if (count === 1 || blocked) return null;
  return (
    <span
      className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
      style={{
        backgroundColor: selected ? "var(--surface-60)" : "var(--neutral-30)",
        color: selected ? "var(--highlight-10)" : "var(--highlight-10)",
      }}
      aria-hidden="true"
    >
      {count}
    </span>
  );
}

function RestrictionBadges({
  row,
  selected,
  blocked,
}: {
  row: DailyListingStateResponse | undefined;
  selected: boolean;
  blocked: boolean;
}) {
  const badges: { label: string; key: string }[] = [];
  if (row?.minStay != null) badges.push({ key: "min", label: `min ${row.minStay}` });
  if (row?.maxStay != null) badges.push({ key: "max", label: `max ${row.maxStay}` });
  if (row?.closedToArrival) badges.push({ key: "cta", label: "CTA" });
  if (row?.closedToDeparture) badges.push({ key: "ctd", label: "CTD" });
  if (row?.stopSell) badges.push({ key: "stop", label: "STOP" });
  if (badges.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.key}
          className="rounded px-1 text-[10px]"
          style={{
            backgroundColor: selected
              ? "var(--surface-60)"
              : blocked
                ? "var(--status-danger-fg)"
                : b.key === "stop"
                  ? "var(--status-danger)"
                  : "var(--neutral-30)",
            color: selected
              ? "var(--highlight-10)"
              : blocked
                ? "var(--status-danger)"
                : b.key === "stop"
                  ? "var(--status-danger-fg)"
                  : "var(--highlight-10)",
          }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

function TriStateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BoolTri;
  onChange: (v: BoolTri) => void;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-body text-highlight-10 font-medium">{label}</legend>
      <div className="gap-base flex flex-wrap items-center">
        {(["unchanged", "off", "on"] as const).map((v) => (
          <label
            key={v}
            className="gap-base text-body flex items-center"
            style={{ color: "var(--text-secondary)" }}
          >
            <input
              type="radio"
              name={`tri-${label}`}
              checked={value === v}
              onChange={() => onChange(v)}
            />
            {v === "unchanged" ? "Leave alone" : v === "on" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
