"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { format, isSameDay, isToday, isTomorrow, startOfDay } from "date-fns";
import { BrushCleaning, CalendarOff, Inbox, LocateFixed, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeframeStepper } from "@/components/views/timeframe-stepper";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { formatChannel } from "@/lib/channels";
import { useAppStore } from "@/stores/app-store";

// Same palettes as calendar-gantt-view / calendar-month-view / calendar-list-view -
// kept per-view rather than shared, matching how those three already do it.
const typeColors: Record<string, string> = {
  booking: "var(--neutral-30)",
  cleaning: "var(--status-success)",
  ticket: "var(--status-danger)",
  vacancy: "var(--neutral-30)",
  availability_block: "var(--status-warning-tint)",
};

const eventTypeLabels: Record<string, string> = {
  cleaning: "Clean",
  ticket: "Ticket",
  vacancy: "Vacancy",
  availability_block: "Blocked",
};

const eventStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const eventStatusFgColors: Record<string, string> = {
  pending: "var(--status-danger-fg)",
  confirmed: "var(--status-confirmed-fg)",
  in_progress: "var(--status-success-fg)",
  completed: "var(--status-success-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
  ota: "var(--channel-ota)",
};

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

interface DayGroup {
  dateKey: string;
  date: Date;
  events: CalendarEvent[];
}

// Grouped by the event's start day - a multi-night booking appears once, on
// its check-in day, with the check-out date shown inline on the card (rather
// than repeating the same card under every night it spans, which is what a
// grid does but an agenda list doesn't need to).
function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const day = startOfDay(new Date(ev.start));
    const key = day.toISOString();
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  const groups = Array.from(map.entries()).map(([dateKey, dayEvents]) => ({
    dateKey,
    date: new Date(dateKey),
    events: dayEvents.sort((a, b) => {
      const timeCmp = new Date(a.start).getTime() - new Date(b.start).getTime();
      return timeCmp !== 0 ? timeCmp : a.listingName.localeCompare(b.listingName);
    }),
  }));
  return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function dayHeaderLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, d MMM");
}

interface AgendaEventCardProps {
  event: CalendarEvent;
  onClick: () => void;
}

function AgendaEventCard({ event, onClick }: AgendaEventCardProps) {
  const accent =
    event.type === "booking"
      ? (channelColors[event.channel ?? "direct"] ?? channelColors.direct)
      : (typeColors[event.type] ?? event.color);

  const statusBg = event.status ? (eventStatusColors[event.status] ?? "var(--highlight-10)") : null;
  const statusFg = event.status ? (eventStatusFgColors[event.status] ?? "var(--surface-60)") : null;

  const icon =
    event.type === "availability_block" ? (
      <CalendarOff size={12} aria-hidden="true" />
    ) : event.type === "cleaning" ? (
      <BrushCleaning size={12} aria-hidden="true" />
    ) : undefined;

  const start = new Date(event.start);
  const end = new Date(event.end);
  const spansMultipleDays = !isSameDay(start, end);

  return (
    <button
      type="button"
      onClick={onClick}
      className="gap-sm bg-surface-60 flex w-full items-stretch overflow-hidden rounded-lg text-left transition-shadow hover:shadow-sm"
    >
      <span className="w-xs shrink-0" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="py-sm pr-sm space-y-xs min-w-0 flex-1">
        <div className="gap-base flex items-center justify-between">
          <span className="text-body text-highlight-10 truncate font-semibold">
            {event.listingName}
          </span>
          {event.status && (
            <Chip tone="solid" size="xs" radius="sm" color={statusBg!} textColor={statusFg!}>
              {event.status.replace("_", " ")}
            </Chip>
          )}
        </div>
        <div className="gap-base flex items-center justify-between">
          <span className="gap-xs text-body text-highlight-10 flex min-w-0 items-center truncate">
            {icon}
            {event.guest ?? eventTypeLabels[event.type] ?? event.label}
          </span>
          {event.amount ? (
            <span className="font-data text-body shrink-0">{formatAUD(event.amount)}</span>
          ) : (
            event.channel && (
              <span className="text-body text-highlight-10 shrink-0">
                {formatChannel(event.channel)}
              </span>
            )
          )}
        </div>
        {spansMultipleDays && (
          <div className="text-body text-highlight-10 opacity-60">
            {format(start, "d MMM")} – {format(end, "d MMM")}
          </div>
        )}
      </div>
    </button>
  );
}

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
}

export function CalendarAgendaView({ events }: CalendarAgendaViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const setTimeframeAnchor = useAppStore((s) => s.setTimeframeAnchor);

  const dayGroups = useMemo(() => groupByDay(events), [events]);

  // Land on today instead of the top of the fetched range (which for
  // windowSize=month starts on the 1st) - the group for today itself if it
  // has anything on it, else the nearest upcoming group. Only the ONE group
  // that's actually today gets the dashed marker below; the fallback is
  // purely about scroll position.
  const scrollTargetGroup = useMemo(() => {
    const today = startOfDay(new Date());
    return (
      dayGroups.find((g) => isSameDay(g.date, today)) ?? dayGroups.find((g) => g.date >= today)
    );
  }, [dayGroups]);

  const stickyRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Double rAF: wait for layout to fully settle (fonts, the note banner's
  // text wrap) before measuring the sticky header - measuring on the same
  // tick as mount under-read its height by ~11px in testing, tucking the
  // today marker/label partly behind it.
  const scrollToTarget = useCallback((smooth: boolean) => {
    const target = scrollTargetRef.current;
    const scrollParent = target?.closest("main");
    if (!target || !scrollParent) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const stickyHeight = stickyRef.current?.getBoundingClientRect().height ?? 0;
        const targetTop =
          target.getBoundingClientRect().top -
          scrollParent.getBoundingClientRect().top +
          scrollParent.scrollTop -
          stickyHeight -
          24;
        scrollParent.scrollTo({
          top: Math.max(0, targetTop),
          behavior: smooth ? "smooth" : "auto",
        });
      });
    });
  }, []);

  useEffect(() => {
    if (hasAutoScrolled.current || !scrollTargetRef.current) return;
    hasAutoScrolled.current = true;
    scrollToTarget(false);
  }, [scrollTargetGroup, scrollToTarget]);

  // Resetting the anchor (if the stepper had paged away from it) refetches
  // events, which changes scrollTargetGroup once the new data lands - the
  // effect above re-fires because hasAutoScrolled was cleared. If the
  // anchor was already null there's nothing to refetch, so scroll directly.
  const handleTodayClick = () => {
    if (anchor !== null) {
      setTimeframeAnchor("calendar", null);
      hasAutoScrolled.current = false;
    } else {
      scrollToTarget(true);
    }
  };

  return (
    <div>
      {/* Sticky so the stepper (the only way to page dates without the
          hamburger drawer) and the desktop note stay reachable while
          scrolling a potentially month-long list. surface-60 background
          matches the page so day groups don't show through underneath it.
          A sticky element's "top" is a threshold measured from the
          scrolling container's PADDING edge, not its border edge - Canvas's
          own padding-top (--space-md - 2px) was otherwise always showing as
          a gap above the stuck bar. A negative top of that same amount
          moves the stick-threshold (and the stuck position) up to Canvas's
          border edge instead, closing the gap; pt-xs restores a little
          internal breathing room since padding is unaffected by this. */}
      <div
        ref={stickyRef}
        className="pt-xs pb-sm sticky"
        style={{
          top: "calc(-1 * (var(--space-md) - 2px))",
          zIndex: 10,
          backgroundColor: "var(--surface-60)",
        }}
      >
        <div className="mb-sm gap-xs flex items-center justify-center">
          <TimeframeStepper />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTodayClick}
            className="ml-auto"
          >
            <LocateFixed size={14} aria-hidden="true" />
            Today
          </Button>
        </div>
        <div className="gap-base px-sm py-base text-body bg-neutral-30 text-highlight-10 flex items-center rounded-lg">
          <Monitor size={16} aria-hidden="true" />
          Calendar view works best on desktop
        </div>
      </div>
      {dayGroups.length === 0 ? (
        <EmptyState icon={Inbox} title="No items to display" />
      ) : (
        <div className="space-y-md">
          {dayGroups.map((group) => {
            const isTodayGroup = isToday(group.date);
            const isScrollTarget = group.dateKey === scrollTargetGroup?.dateKey;
            return (
              <div key={group.dateKey} ref={isScrollTarget ? scrollTargetRef : undefined}>
                <h3
                  className="mb-xs gap-xs text-body flex items-center font-semibold tracking-wide uppercase"
                  style={{ color: isTodayGroup ? "var(--status-danger)" : "var(--text-secondary)" }}
                >
                  {dayHeaderLabel(group.date)}
                  {isTodayGroup && (
                    <span
                      aria-hidden="true"
                      className="flex-1"
                      style={{ borderTop: "2px dashed var(--status-danger)" }}
                    />
                  )}
                </h3>
                <div className="gap-xs flex flex-col">
                  {group.events.map((event) => (
                    <AgendaEventCard
                      key={`${event.id}:${event.listingId}`}
                      event={event}
                      onClick={() => {
                        if (event.type === "availability_block") {
                          openAvailabilityBlockDrawer(event.id);
                          return;
                        }
                        openDrillDownPanel(event.type, event.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
