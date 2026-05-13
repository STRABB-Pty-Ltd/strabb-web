"use client";

import { CalendarDays, GanttChart, List, type LucideIcon } from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

interface ViewOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Only the calendar page exposes a manual view picker. Messaging and cleaning
// derive their view from the active submenu chip (see submenu-bar.tsx).
const viewOptions: Record<string, ViewOption[]> = {
  calendar: [
    { id: "gantt", label: "Gantt", icon: GanttChart },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "list", label: "List", icon: List },
  ],
};

export function ViewSwitcher({ page }: { page: PageId }) {
  const setView = useAppStore((s) => s.setView);
  const calendarView = useAppStore((s) => s.calendar.view);

  const options = viewOptions[page];
  if (!options) return null;

  const currentView = page === "calendar" ? calendarView : "";

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        View
      </h3>
      <div className="gap-xs flex flex-col">
        {options.map((opt) => {
          const isActive = currentView === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setView(page as "calendar" | "messaging" | "cleaning", opt.id)}
              className={`gap-base px-sm py-base text-body flex items-center rounded-lg transition-colors ${isActive ? "font-semibold" : "font-medium"}`}
              style={{
                backgroundColor: isActive ? "var(--highlight-10)" : "var(--neutral-30)",
                color: isActive ? "var(--surface-60)" : "var(--highlight-10)",
              }}
            >
              <Icon size={13} aria-hidden="true" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
