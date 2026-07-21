// Every top-level nav page (dashboard/calendar/messaging/operations/
// reporting/settings) plus the two full-page routes reachable from them
// (bookings, properties) that G.5 calls out by name. This is the page set
// the "usable on a phone (375px)" exit criteria applies to. Kept in its own
// non-test module (rather than exported from a .spec.ts file) because
// importing a file with top-level test.describe() calls re-executes them,
// which would double-register those tests under the importing file.
export const CORE_PAGES = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/calendar", name: "calendar" },
  { path: "/messaging", name: "messaging" },
  { path: "/operations", name: "operations" },
  { path: "/reporting", name: "reporting" },
  { path: "/settings", name: "settings" },
  { path: "/bookings", name: "bookings" },
  { path: "/properties", name: "properties" },
];
