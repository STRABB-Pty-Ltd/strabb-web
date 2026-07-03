"use client";

import { CalendarClock, ClipboardList, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Portal destinations. Three only; the active tab is derived from the pathname
// (Tasks owns /portal and every task detail under it). Each target clears the
// 44px WCAG touch minimum. Shared by the phone bottom bar and the desktop top
// nav so the two stay in lockstep.
const TABS = [
  {
    href: "/portal",
    label: "Tasks",
    icon: ClipboardList,
    match: (p: string) => p === "/portal" || p.startsWith("/portal/tasks"),
  },
  {
    href: "/portal/availability",
    label: "Availability",
    icon: CalendarClock,
    match: (p: string) => p.startsWith("/portal/availability"),
  },
  {
    href: "/portal/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/portal/account"),
  },
] as const;

/**
 * Phone bottom tab bar. Hidden at md+ (the desktop top nav takes over) so the
 * layout below md is byte-for-byte the mobile-first original.
 */
export function PortalNav() {
  const pathname = usePathname() ?? "/portal";

  return (
    <nav
      aria-label="Portal"
      className="fixed right-0 bottom-0 left-0 z-10 md:hidden"
      style={{
        borderTop: "var(--hairline) solid var(--border)",
        backgroundColor: "var(--neutral-30)",
      }}
    >
      <div className="mx-auto flex max-w-[480px]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="gap-xs py-base text-body flex flex-1 flex-col items-center justify-center font-medium"
              style={{
                minHeight: "var(--touch-target-min)",
                color: active ? "var(--highlight-10)" : "var(--text-secondary)",
              }}
            >
              <Icon size={20} aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Desktop/tablet top nav, rendered inline in the portal header. Hidden below md
 * (the bottom bar owns phones). Horizontal icon+label pills, same destinations
 * and active logic as the bottom bar.
 */
export function PortalTopNav() {
  const pathname = usePathname() ?? "/portal";

  return (
    <nav aria-label="Portal" className="gap-xs hidden items-center md:flex">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className="gap-xs px-sm py-base text-body flex items-center rounded-lg font-medium"
            style={{
              minHeight: "var(--touch-target-min)",
              backgroundColor: active ? "var(--highlight-10)" : "transparent",
              color: active ? "var(--surface-60)" : "var(--text-secondary)",
            }}
          >
            <Icon size={18} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
