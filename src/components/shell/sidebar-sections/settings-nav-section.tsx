"use client";

import {
  Bell,
  CreditCard,
  Globe,
  Phone,
  Radio,
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

  const handleSectionClick = (id: string) => {
    setSection(id);
    if (onAdminRoute) router.push("/settings");
  };

  return (
    <nav aria-label="Settings" style={{ padding: "var(--space-sm)" }}>
      <div className="gap-xs flex flex-col">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = !onAdminRoute && section === s.id;
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
      </div>
    </nav>
  );
}
