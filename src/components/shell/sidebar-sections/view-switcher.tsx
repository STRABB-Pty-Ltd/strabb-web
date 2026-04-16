"use client";

import { CalendarDays, Columns3, GanttChart, List, type LucideIcon } from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

interface ViewOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

const viewOptions: Record<string, ViewOption[]> = {
  calendar: [
    { id: "gantt", label: "Gantt", icon: GanttChart },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "list", label: "List", icon: List },
  ],
  messaging: [
    { id: "kanban", label: "Kanban", icon: Columns3 },
    { id: "list", label: "List", icon: List },
  ],
  cleaning: [
    { id: "kanban", label: "Kanban", icon: Columns3 },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "list", label: "List", icon: List },
    { id: "gantt", label: "Gantt", icon: GanttChart },
  ],
};

export function ViewSwitcher({ page }: { page: PageId }) {
  const setView = useAppStore((s) => s.setView);
  const calendarView = useAppStore((s) => s.calendar.view);
  const messagingView = useAppStore((s) => s.messaging.view);
  const cleaningView = useAppStore((s) => s.cleaning.view);

  const options = viewOptions[page];
  if (!options) return null;

  const viewByPage: Record<string, string> = {
    calendar: calendarView,
    messaging: messagingView,
    cleaning: cleaningView,
  };
  const currentView = viewByPage[page] ?? "";

  return (
    <div className="border-b" style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">View</h3>
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => {
          const isActive = currentView === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(page as "calendar" | "messaging" | "cleaning", opt.id)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              style={
                isActive
                  ? {
                      borderLeft: "3px solid var(--strabb-secondary)",
                      fontWeight: 600,
                      backgroundColor: "rgba(59, 130, 246, 0.05)",
                      color: "var(--strabb-secondary)",
                    }
                  : {
                      borderLeft: "3px solid transparent",
                      color: "#374151",
                    }
              }
            >
              <Icon size={16} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
