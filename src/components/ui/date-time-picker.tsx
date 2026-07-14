"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X } from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth } from "date-fns";

import { useClickOutside } from "@/hooks/use-click-outside";
import { MonthGrid } from "@/components/ui/month-grid";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  id?: string;
  /** "YYYY-MM-DD" (when showTime=false) or "YYYY-MM-DDTHH:MM" (when true). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  className?: string;
  background?: string;
}

const ISO_DATE = "yyyy-MM-dd";
const ISO_DATETIME_LOCAL = "yyyy-MM-dd'T'HH:mm";
const DISPLAY_DATE = "d MMM yyyy";
const DISPLAY_DATETIME = "d MMM yyyy, HH:mm";
const POPOVER_WIDTH = 296;

function parseValue(value: string): Date | null {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function combineDateAndTime(day: Date, hours: number, minutes: number): Date {
  const out = new Date(day);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  showTime = true,
  disabled = false,
  className,
  background = "var(--neutral-30)",
  ...ariaProps
}: DateTimePickerProps) {
  // Memoise parsed so [parsed] dep lists don't loop on a fresh Date each render.
  const parsed = useMemo(() => parseValue(value), [value]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(parsed ?? new Date());
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Snap calendar back to the value's month whenever the external value changes.
  useEffect(() => {
    if (parsed) setViewDate(startOfMonth(parsed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Compute popover position relative to the trigger every time it opens.
  // Place it directly below with a small gap; flip up if it would overflow.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const approxHeight = showTime ? 340 : 290;
    const flipUp = rect.bottom + approxHeight + 8 > window.innerHeight;
    setPos({
      top: flipUp ? rect.top - approxHeight - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8)),
    });
  }, [open, showTime]);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(popoverRef, close, open);

  // Esc closes. Click outside closes via useClickOutside on the popover panel
  // (the trigger is outside the panel ref, so clicking it while open would
  // also fire useClickOutside; guard re-open click by toggling on trigger).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const hours = parsed?.getHours() ?? 9;
  const minutes = parsed?.getMinutes() ?? 0;

  const writeValue = useCallback(
    (day: Date | null, h: number, m: number) => {
      if (!day) {
        onChange("");
        return;
      }
      if (showTime) {
        onChange(format(combineDateAndTime(day, h, m), ISO_DATETIME_LOCAL));
      } else {
        onChange(format(day, ISO_DATE));
      }
    },
    [onChange, showTime],
  );

  const handleDayClick = (day: Date) => {
    writeValue(day, hours, minutes);
    if (!showTime) setOpen(false);
  };

  const handleTimeChange = (next: { h?: number; m?: number }) => {
    if (!parsed) return;
    const h = next.h ?? hours;
    const m = next.m ?? minutes;
    writeValue(parsed, h, m);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const display = parsed ? format(parsed, showTime ? DISPLAY_DATETIME : DISPLAY_DATE) : placeholder;
  const isPlaceholder = !parsed;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={ariaProps["aria-invalid"]}
        aria-describedby={ariaProps["aria-describedby"]}
        aria-labelledby={ariaProps["aria-labelledby"]}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "border-field-border hover:border-field-border-hover px-sm py-base text-body w-full rounded-lg border text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          "gap-base flex items-center justify-between",
          className,
        )}
        style={{ backgroundColor: background }}
      >
        <span
          className="truncate"
          style={{
            color: isPlaceholder ? "var(--text-secondary)" : "var(--highlight-10)",
          }}
        >
          {display}
        </span>
        <Calendar size={14} style={{ color: "var(--highlight-10)", flexShrink: 0 }} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            className="p-sm rounded-lg border shadow-xl"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              backgroundColor: "var(--surface-60)",
              borderColor: "var(--border)",
              zIndex: 200,
            }}
          >
            <MonthGrid
              viewDate={viewDate}
              onViewDateChange={setViewDate}
              isHighlighted={() => false}
              isStrongHighlighted={(d) => (parsed ? isSameDay(d, parsed) : false)}
              onDayClick={handleDayClick}
            />
            {showTime && (
              <div
                className="mt-sm pt-sm gap-base flex items-center border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <label
                  htmlFor={id ? `${id}-hour` : undefined}
                  className="text-body text-highlight-10 font-medium"
                >
                  Time
                </label>
                <input
                  id={id ? `${id}-hour` : undefined}
                  type="number"
                  min={0}
                  max={23}
                  value={String(hours).padStart(2, "0")}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (Number.isFinite(n) && n >= 0 && n <= 23) handleTimeChange({ h: n });
                  }}
                  disabled={!parsed}
                  className="font-data text-body px-base py-xs border-field-border w-[55px] rounded border text-center disabled:opacity-60"
                  style={{ backgroundColor: "var(--neutral-30)" }}
                  aria-label="Hour"
                />
                <span className="text-body text-highlight-10">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={String(minutes).padStart(2, "0")}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (Number.isFinite(n) && n >= 0 && n <= 59) handleTimeChange({ m: n });
                  }}
                  disabled={!parsed}
                  className="font-data text-body px-base py-xs border-field-border w-[55px] rounded border text-center disabled:opacity-60"
                  style={{ backgroundColor: "var(--neutral-30)" }}
                  aria-label="Minute"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="gap-xs text-body text-highlight-10 hover:bg-neutral-30 px-base py-xs ml-auto inline-flex items-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                >
                  <X size={12} />
                  Clear
                </button>
              </div>
            )}
            {!showTime && parsed && (
              <div
                className="mt-sm pt-sm flex justify-end border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="button"
                  onClick={handleClear}
                  className="gap-xs text-body text-highlight-10 hover:bg-neutral-30 px-base py-xs inline-flex items-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                >
                  <X size={12} />
                  Clear
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
