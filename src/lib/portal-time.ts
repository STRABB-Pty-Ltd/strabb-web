import { DEFAULT_TIMEZONE } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";

/**
 * Portal "when" formatter for a clean's scheduled datetime.
 *
 * The api's PortalTaskResponse.scheduled_date is a full UTC datetime (not a
 * plain YYYY-MM-DD), so it must be converted for display with date-fns-tz
 * rather than hand-rolled, matching the owner-side detail drawers. The result
 * reads like "Thu 7 Aug, 12:55 pm".
 *
 * The clean is rendered in the property's own timezone, carried on the task as
 * an IANA string (PortalTaskResponse.timezone). The app default zone is used
 * only as a fallback for a task whose timezone is absent, so this stays robust
 * regardless of api/web merge order.
 */
export function formatPortalWhen(
  scheduledDate: string | null | undefined,
  timezone?: string | null,
): string {
  if (!scheduledDate) return "Unscheduled";
  const parsed = new Date(scheduledDate);
  if (Number.isNaN(parsed.getTime())) return "Unscheduled";
  const zone = timezone ?? DEFAULT_TIMEZONE;
  return formatInPropertyTimezone(scheduledDate, zone, "EEE d MMM, h:mm aaa");
}
