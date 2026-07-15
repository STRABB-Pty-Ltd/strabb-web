"use client";

import { usePathname, useRouter } from "next/navigation";

import { chipVariants } from "@/components/ui/chip";
import { settingsSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

/** Horizontal scrollable equivalent of SettingsNavSection (the desktop
 *  sidebar's vertical tab list, hidden below lg alongside the rest of
 *  ContextualSidebar - M.1). Without this, 8 of Settings' 9 destinations
 *  had no way to be reached on mobile at all: General renders by default
 *  and nothing else could ever be selected (found in the M.4 mobile
 *  audit). Same sections list, same click/active logic, chip row instead
 *  of a vertical list. */
export function SettingsMobileNav() {
  const section = useAppStore((s) => s.settings.section);
  const setSection = useAppStore((s) => s.setSection);
  const pathname = usePathname();
  const router = useRouter();
  const onSubRoute = (pathname?.startsWith("/settings/") ?? false) && pathname !== "/settings";

  const handleSectionClick = (id: string) => {
    setSection(id);
    if (onSubRoute) router.push("/settings");
  };

  return (
    <nav aria-label="Settings" className="no-scrollbar -mx-md mb-sm overflow-x-auto lg:hidden">
      <div className="gap-xs px-md flex">
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
                chipVariants({
                  tone: active ? "accent" : "neutral",
                  radius: "pill",
                  interactive: true,
                }),
                "shrink-0 border-0 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
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
