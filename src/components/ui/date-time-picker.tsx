"use client";

import { useCallback, useEffect, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Calendar, X } from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth } from "date-fns";

import { MonthGrid } from "@/components/ui/month-grid";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  id?: string;
  /** ISO-ish "YYYY-MM-DD" (when showTime=false) or "YYYY-MM-DDTHH:MM" (when true). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  /** Class additions for the trigger button. */
  className?: string;
}

const ISO_DATE = "yyyy-MM-dd";
const ISO_DATETIME_LOCAL = "yyyy-MM-dd'T'HH:mm";
const DISPLAY_DATE = "d MMM yyyy";
const DISPLAY_DATETIME = "d MMM yyyy, HH:mm";

function parseValue(value: string, showTime: boolean): Date | null {
  if (!value) return null;
  try {
    if (showTime) {
      // datetime-local format "YYYY-MM-DDTHH:MM" - parseISO handles it.
      return parseISO(value);
    }
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
  ...ariaProps
}: DateTimePickerProps) {
  const parsed = parseValue(value, showTime);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(parsed ?? new Date());

  // When the value changes externally (e.g. parent resets), pull the calendar
  // back to the relevant month so the next open shows the value's month.
  useEffect(() => {
    if (parsed) setViewDate(startOfMonth(parsed));
  }, [parsed]);

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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        type="button"
        disabled={disabled}
        aria-invalid={ariaProps["aria-invalid"]}
        aria-describedby={ariaProps["aria-describedby"]}
        aria-labelledby={ariaProps["aria-labelledby"]}
        className={cn(
          "px-sm py-base text-body w-full rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          "gap-base flex items-center justify-between",
          className,
        )}
        style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
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
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} align="start">
          <Popover.Popup
            className="p-sm rounded-lg border shadow-xl outline-none"
            style={{
              backgroundColor: "var(--surface-60)",
              borderColor: "var(--border)",
              zIndex: 200,
              width: 296,
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
                  className="font-data text-body px-base py-xs w-[55px] rounded border text-center disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--surface-60)",
                    borderColor: "var(--border)",
                  }}
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
                  className="font-data text-body px-base py-xs w-[55px] rounded border text-center disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--surface-60)",
                    borderColor: "var(--border)",
                  }}
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
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
