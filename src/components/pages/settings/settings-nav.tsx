"use client";

import { Bell, Building2, CreditCard, Globe, Radio, Settings, Sparkles, Users } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

const sections = [
  { id: "general", label: "General", icon: Settings },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "cleaning", label: "Cleaning", icon: Sparkles },
  { id: "channels", label: "Channels", icon: Radio },
] as const;

export function SettingsNav() {
  const section = useAppStore((s) => s.settings.section);
  const setSection = useAppStore((s) => s.setSection);

  return (
    <nav className="shrink-0 border-r" style={{ width: 233, borderColor: "var(--border)" }}>
      <div className="space-y-xs p-base">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className="flex w-full items-center gap-base rounded-lg px-sm py-base text-body transition-colors"
              style={{
                backgroundColor: active ? "rgba(59, 130, 246, 0.08)" : undefined,
                color: active ? "var(--strabb-secondary)" : "var(--brand-10)",
                fontWeight: active ? 600 : 400,
                borderLeft: active ? "3px solid var(--strabb-secondary)" : "3px solid transparent",
              }}
            >
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
