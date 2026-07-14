"use client";

import { CalendarClock, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { TimeframeStepper } from "@/components/views/timeframe-stepper";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

/** Page-specific widget shown beside the view chips: the timeframe
 *  stepper everywhere, except Messaging's own Templates/Scheduled
 *  sub-route links. Extracted out of SubmenuBar (M.3) so both it and
 *  MobileNavDrawer render the same widget without duplicating the
 *  ternary - this is markup, not chip-behavior state, so it stays
 *  separate from useSubmenuChips. No props: reads currentPage/pathname
 *  itself so each caller only supplies its own layout wrapper. */
export function SubmenuLeftSlot() {
  const currentPage = useAppStore((s) => s.currentPage);
  const pathname = usePathname();

  if (currentPage !== "messaging") return <TimeframeStepper />;

  return (
    <>
      {[
        { href: "/messaging/templates", label: "Templates", icon: FileText },
        { href: "/messaging/scheduled", label: "Scheduled messages", icon: CalendarClock },
      ].map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "gap-xs px-base py-base text-body hover:bg-neutral-30 text-highlight-10 inline-flex min-h-[var(--touch-target-min)] items-center rounded-sm font-semibold",
              active && "bg-neutral-30",
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
