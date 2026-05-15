"use client";

import {
  CreditCard,
  Globe,
  Inbox,
  Phone,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useAppStore } from "@/stores/app-store";

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "cleaning", label: "Cleaning", icon: Sparkles },
  { id: "channels", label: "Channels", icon: Radio },
] as const;

export function SettingsNavSection() {
  const section = useAppStore((s) => s.settings.section);
  const setSection = useAppStore((s) => s.setSection);
  const pathname = usePathname();
  const router = useRouter();
  // Sub-routes (/settings/sync-logs, /settings/shareable-links,
  // /settings/listings) used to appear as sidebar links. They now drill in
  // from cards inside the relevant section. Clicking a section while on
  // any of those sub-routes routes back to /settings root.
  const onSubRoute =
    (pathname?.startsWith("/settings/") ?? false) && pathname !== "/settings";

  const handleSectionClick = (id: string) => {
    setSection(id);
    if (onSubRoute) router.push("/settings");
  };

  return (
    <nav aria-label="Settings" style={{ padding: "var(--space-sm)" }}>
      <div className="gap-xs flex flex-col">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = !onSubRoute && section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSectionClick(s.id)}
              aria-current={active ? "page" : undefined}
              className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: active ? "var(--highlight-10)" : "var(--neutral-30)",
                color: active ? "var(--surface-60)" : "var(--highlight-10)",
              }}
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
