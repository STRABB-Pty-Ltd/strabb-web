"use client";

import {
  Bell,
  CreditCard,
  Globe,
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
  const onSubRoute = onAdminRoute || onSyncLogsRoute || onShareableLinksRoute;

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
                backgroundColor: active ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: active ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
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
            backgroundColor: onAdminRoute ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
            color: onAdminRoute ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
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
            backgroundColor: onSyncLogsRoute ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
            color: onSyncLogsRoute ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
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
            backgroundColor: onShareableLinksRoute
              ? "var(--btn-active-bg)"
              : "var(--btn-inactive-bg)",
            color: onShareableLinksRoute ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          }}
        >
          <Link2 size={14} />
          Shareable links
        </Link>
      </div>
    </nav>
  );
}
