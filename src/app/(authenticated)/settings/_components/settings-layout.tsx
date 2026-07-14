"use client";

import { useAppStore } from "@/stores/app-store";

import { BillingSection } from "./sections/billing-section";
import { ChannelsSection } from "./sections/channels-section";
import { CleaningSection } from "./sections/cleaning-section";
import { ExpensesSection } from "./sections/expenses-section";
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
  expenses: ExpensesSection,
  channels: ChannelsSection,
};

export function SettingsLayout() {
  const section = useAppStore((s) => s.settings.section);
  const ActiveSection = sectionComponents[section] ?? GeneralSection;

  // No own padding: the canvas already provides the page grid's px-md and
  // top offset. Stacking p-md on top pushed settings 21px off the grid
  // every other page sits on.
  return <ActiveSection />;
}
