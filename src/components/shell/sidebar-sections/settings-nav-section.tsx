"use client";

import {
  Building2,
  CreditCard,
  Globe,
  Inbox,
  Phone,
  Radio,
  Receipt,
  Settings,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

// Most tabs switch an in-page section via store state. Listings is route-driven
// (`href`): it lives at its own /settings/listings page, so its tab navigates
// there and lights up on that route rather than toggling section state.
// Exported for SettingsMobileNav (this sidebar section is lg+ only, see
// contextual-sidebar.tsx - below lg, settings-mobile-nav.tsx renders the
// same list as a horizontal chip row instead).
export const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "listings", label: "Listings", icon: Building2, href: "/settings/listings" },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "cleaning", label: "Cleaning", icon: Sparkles },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "channels", label: "Channels", icon: Radio },
] as const;

export function SettingsNavSection() {
  const section = useAppStore((s) => s.settings.section);
  const setSection = useAppStore((s) => s.setSection);
  const pathname = usePathname();
  const router = useRouter();
  // The remaining sub-routes (/settings/sync-logs, /settings/shareable-links)
  // have no tab - they drill in from cards inside a section. Clicking a
  // state-driven section while on any sub-route routes back to /settings root.
  const onSubRoute = (pathname?.startsWith("/settings/") ?? false) && pathname !== "/settings";

  const handleSectionClick = (id: string) => {
    setSection(id);
    if (onSubRoute) router.push("/settings");
  };

  return (
    <nav aria-label="Settings" className="p-sm">
      <div className="gap-xs flex flex-col">
        {settingsSections.map((s) => {
          const Icon = s.icon;
          const href = "href" in s ? s.href : undefined;
          const active = href ? pathname === href : !onSubRoute && section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => (href ? router.push(href) : handleSectionClick(s.id))}
              aria-current={active ? "page" : undefined}
              className={cn(
                "gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors",
                active ? "bg-highlight-10 text-surface-60" : "bg-neutral-30 text-highlight-10",
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
