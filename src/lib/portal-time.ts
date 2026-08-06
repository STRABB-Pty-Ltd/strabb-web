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
 * Timezone caveat: the cleaner portal is deliberately narrow and its task
 * payload carries neither a `timezone` field nor any owner-scoped property data
 * to resolve one from, so we render in the app default zone. Adding a
 * `timezone` field to PortalTaskResponse (api) is the follow-up that would make
 * this fully property-local; until then a clean in a non-default zone (e.g.
 * Australia/Perth) can read up to a few hours off local wall-clock time.
 */
export function formatPortalWhen(scheduledDate: string | null | undefined): string {
  if (!scheduledDate) return "Unscheduled";
  const parsed = new Date(scheduledDate);
  if (Number.isNaN(parsed.getTime())) return "Unscheduled";
  return formatInPropertyTimezone(scheduledDate, DEFAULT_TIMEZONE, "EEE d MMM, h:mm aaa");
}
