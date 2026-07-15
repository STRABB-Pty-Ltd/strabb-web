"use client";

import { usePathname, useRouter } from "next/navigation";

import { settingsSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

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
