"use client";

import {
  Bell,
  CreditCard,
  Globe,
  Home,
  Inbox,
  Link2,
  Phone,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAppStore } from "@/stores/app-store";

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
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
  const onAdminRoute = pathname?.startsWith("/settings/admin") ?? false;
  const onSyncLogsRoute = pathname?.startsWith("/settings/sync-logs") ?? false;
  const onShareableLinksRoute = pathname?.startsWith("/settings/shareable-links") ?? false;
  const onListingsRoute = pathname?.startsWith("/settings/listings") ?? false;
  const onSubRoute = onAdminRoute || onSyncLogsRoute || onShareableLinksRoute || onListingsRoute;

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
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
        <Link
          href="/settings/admin"
          aria-current={onAdminRoute ? "page" : undefined}
          className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: onAdminRoute ? "var(--highlight-10)" : "var(--neutral-30)",
            color: onAdminRoute ? "var(--surface-60)" : "var(--highlight-10)",
          }}
        >
          <ShieldCheck size={14} />
          Admin
        </Link>
        <Link
          href="/settings/sync-logs"
          aria-current={onSyncLogsRoute ? "page" : undefined}
          className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: onSyncLogsRoute ? "var(--highlight-10)" : "var(--neutral-30)",
            color: onSyncLogsRoute ? "var(--surface-60)" : "var(--highlight-10)",
          }}
        >
          <RefreshCw size={14} />
          Sync logs
        </Link>
        <Link
          href="/settings/shareable-links"
          aria-current={onShareableLinksRoute ? "page" : undefined}
          className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: onShareableLinksRoute ? "var(--highlight-10)" : "var(--neutral-30)",
            color: onShareableLinksRoute ? "var(--surface-60)" : "var(--highlight-10)",
          }}
        >
          <Link2 size={14} />
          Shareable links
        </Link>
        <Link
          href="/settings/listings"
          aria-current={onListingsRoute ? "page" : undefined}
          className="gap-base px-sm py-base text-body flex w-full items-center rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: onListingsRoute ? "var(--highlight-10)" : "var(--neutral-30)",
            color: onListingsRoute ? "var(--surface-60)" : "var(--highlight-10)",
          }}
        >
          <Home size={14} />
          Listings
        </Link>
      </div>
    </nav>
  );
}
