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
  useUpdateListingRestrictions,
} from "@/lib/api-hooks/listing-state-api";
import type {
  DailyListingStateResponse,
  RestrictionsUpdateRequest,
} from "@/lib/schemas/listing-state";
import { useAppStore } from "@/stores/app-store";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_OPTS = { weekStartsOn: 1 as const };

interface RestrictionsCalendarProps {
  listingId: string;
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
  minStay: string; // empty = leave alone
  maxStay: string;
  closedToArrival: BoolTri;
  closedToDeparture: BoolTri;
  stopSell: BoolTri;
}

const EMPTY_FORM: EditFormState = {
  minStay: "",
  maxStay: "",
  closedToArrival: "unchanged",
  closedToDeparture: "unchanged",
  stopSell: "unchanged",
};

export function RestrictionsCalendar({ listingId }: RestrictionsCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selection, setSelection] = useState<{ anchor: string; head: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
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
  const updateRestrictions = useUpdateListingRestrictions();

  const rowsByDate = useMemo(() => {
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
      setSelection({ anchor: selection.anchor, head: iso });
    } else {
      setSelection({ anchor: iso, head: iso });
    }
  };

  // For single-cell selection, pre-fill the dialog with the current
  // values so a partial edit feels like "tweak this one thing". For
  // ranges, leave everything blank ("unchanged") since the dates may
  // disagree.
  const openEditFromSelection = () => {
    if (!selection) return;
    const isSingle = selection.anchor === selection.head;
    if (isSingle) {
      const row = rowsByDate.get(selection.anchor);
      setForm({
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

  const buildPayload = ():
    | {
        body: RestrictionsUpdateRequest;
        fieldCount: number;
      }
    | { error: string } => {
    if (!selection) return { error: "No dates selected" };
    const { from, to } = cellsInSelection(selection);
    const body: RestrictionsUpdateRequest =
      from === to ? { date: from } : { dateFrom: from, dateTo: to };

    let fieldCount = 0;

    if (form.minStay.trim() !== "") {
      const n = Number(form.minStay);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return { error: "Min stay must be a whole number from 1 to 365" };
      }
      body.minStay = n;
      fieldCount += 1;
    }
    if (form.maxStay.trim() !== "") {
      const n = Number(form.maxStay);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return { error: "Max stay must be a whole number from 1 to 365" };
      }
      body.maxStay = n;
      fieldCount += 1;
    }
    if (body.minStay != null && body.maxStay != null && body.maxStay < body.minStay) {
      return { error: "Max stay must be greater than or equal to min stay" };
    }
    if (form.closedToArrival !== "unchanged") {
      body.closedToArrival = form.closedToArrival === "on";
      fieldCount += 1;
    }
    if (form.closedToDeparture !== "unchanged") {
      body.closedToDeparture = form.closedToDeparture === "on";
      fieldCount += 1;
    }
    if (form.stopSell !== "unchanged") {
      body.stopSell = form.stopSell === "on";
      fieldCount += 1;
    }

    if (fieldCount === 0) {
      return { error: "Change at least one restriction" };
    }
    return { body, fieldCount };
  };

  const handleSave = async () => {
    const built = buildPayload();
    if ("error" in built) {
      setFormError(built.error);
      return;
    }
    try {
      await updateRestrictions.mutateAsync({ listingId, body: built.body });
      addToast({ type: "success", message: "Restrictions updated" });
      setEditOpen(false);
      setSelection(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // ---- render -------------------------------------------------------

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
        show only the restrictions currently set — blank means no override.
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
              className="text-body min-h-[72px] rounded p-1 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: fg, backgroundColor: bg, opacity: inMonth ? 1 : 0.5 }}
              aria-pressed={isSelected}
              aria-label={`${format(day, "PPP")}${describeRestrictions(row)}`}
            >
              <div className="text-xs font-semibold">{day.getDate()}</div>
              <RestrictionBadges row={row} selected={isSelected} />
            </button>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selection && selection.anchor !== selection.head
                ? "Edit restrictions for date range"
                : "Edit restrictions"}
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
            <Button onClick={handleSave} disabled={updateRestrictions.isPending}>
              {updateRestrictions.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------

function describeRestrictions(row: DailyListingStateResponse | undefined): string {
  if (!row) return "";
  const parts: string[] = [];
  if (row.minStay != null) parts.push(`min stay ${row.minStay}`);
  if (row.maxStay != null) parts.push(`max stay ${row.maxStay}`);
  if (row.closedToArrival) parts.push("closed to arrival");
  if (row.closedToDeparture) parts.push("closed to departure");
  if (row.stopSell) parts.push("stop sell");
  return parts.length ? `, ${parts.join(", ")}` : "";
}

function RestrictionBadges({
  row,
  selected,
}: {
  row: DailyListingStateResponse | undefined;
  selected: boolean;
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
          className="rounded px-1 text-xs"
          style={{
            backgroundColor: selected
              ? "var(--surface-60)"
              : b.key === "stop"
                ? "var(--status-danger)"
                : "var(--neutral-30)",
            color: selected
              ? "var(--highlight-10)"
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
