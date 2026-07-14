import { CalendarClock, Clock, MessageSquare, RefreshCw, Wrench } from "lucide-react";

/** Icon + accent color per AlertItem type/severity - shared by the
 *  dashboard's AlertStrip and the mobile top bar's notifications
 *  dropdown, so it lives here rather than in AlertStrip's page-private
 *  _components folder (shell components importing page-internals is a
 *  layering violation the other way around). */
export const severityAccent: Record<string, string> = {
  red: "var(--status-issues)",
  amber: "var(--status-issues)",
  blue: "var(--highlight-10)",
};

export const typeIcon: Record<string, React.ElementType> = {
  message: MessageSquare,
  unscheduled: CalendarClock,
  "past-due-clean": Clock,
  ticket: Wrench,
  sync: RefreshCw,
};
