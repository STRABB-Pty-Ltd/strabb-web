import { formatInTimeZone } from "date-fns-tz";

/**
 * Format a UTC date string for display in a property's timezone.
 *
 * @param utcDateStr - ISO date string (UTC from API)
 * @param timezone - IANA timezone string (e.g. "Australia/Sydney")
 * @param fmt - date-fns format string (default: "d MMM yyyy, h:mm a")
 * @returns Formatted date string in property timezone
 */
export function formatInPropertyTimezone(
  utcDateStr: string,
  timezone: string,
  fmt = "d MMM yyyy, h:mm a",
): string {
  return formatInTimeZone(new Date(utcDateStr), timezone, fmt);
}

/**
 * Format just the date portion in a property's timezone.
 */
export function formatDateInTimezone(utcDateStr: string, timezone: string): string {
  return formatInTimeZone(new Date(utcDateStr), timezone, "d MMM yyyy");
}

/**
 * Format a short timezone label (e.g. "AEST", "AEDT").
 */
export function getTimezoneAbbr(utcDateStr: string, timezone: string): string {
  return formatInTimeZone(new Date(utcDateStr), timezone, "zzz");
}
