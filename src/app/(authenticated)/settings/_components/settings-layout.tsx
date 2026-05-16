"use client";

import { useAppStore } from "@/stores/app-store";

import { BillingSection } from "./sections/billing-section";
import { ChannelsSection } from "./sections/channels-section";
import { CleaningSection } from "./sections/cleaning-section";
import { GeneralSection } from "./sections/general-section";
import { InboxSection } from "./sections/inbox-section";
import { IntegrationsSection } from "./sections/integrations-section";
import { PhoneSection } from "./sections/phone-section";

const sectionComponents: Record<string, React.ComponentType> = {
  general: GeneralSection,
  billing: BillingSection,
  phone: PhoneSection,
  inbox: InboxSection,
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
