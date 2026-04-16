"use client";

import { useAppStore } from "@/stores/app-store";

import { SettingsNav } from "./settings-nav";
import { GeneralSection } from "./sections/general-section";
import { TeamSection } from "./sections/team-section";
import { BillingSection } from "./sections/billing-section";
import { NotificationsSection } from "./sections/notifications-section";
import { IntegrationsSection } from "./sections/integrations-section";
import { CleaningSection } from "./sections/cleaning-section";
import { ChannelsSection } from "./sections/channels-section";

const sectionComponents: Record<string, React.ComponentType> = {
  general: GeneralSection,
  team: TeamSection,
  billing: BillingSection,
  notifications: NotificationsSection,
  integrations: IntegrationsSection,
  cleaning: CleaningSection,
  channels: ChannelsSection,
};

export function SettingsLayout() {
  const section = useAppStore((s) => s.settings.section);
  const ActiveSection = sectionComponents[section] ?? GeneralSection;

  return (
    <div
      className="flex rounded-lg border bg-white"
      style={{
        borderColor: "var(--border)",
        minHeight: "calc(100vh - 160px)",
      }}
    >
      <SettingsNav />
      <div className="flex-1 overflow-y-auto p-6">
        <ActiveSection />
      </div>
    </div>
  );
}
