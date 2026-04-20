"use client";

import { useAppStore } from "@/stores/app-store";

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
    <div className="p-md">
      <ActiveSection />
    </div>
  );
}
