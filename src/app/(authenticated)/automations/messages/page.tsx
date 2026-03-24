"use client";

import { MailIcon, PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useMessageTemplates, useProcessMessages, useSeedDefaults } from "@/hooks/use-messages";
import { useProperties } from "@/hooks/use-properties";
import {
  TEMPLATE_KEY_LABELS,
  TRIGGER_TYPE_OPTIONS,
  type MessageTemplateResponse,
} from "@/lib/schemas/message";

const triggerLabel = Object.fromEntries(TRIGGER_TYPE_OPTIONS.map((t) => [t.value, t.label]));

export default function MessagesPage() {
  const { data: templates, isLoading } = useMessageTemplates();
  const { data: propertiesData } = useProperties();
  const seedDefaults = useSeedDefaults();
  const processMessages = useProcessMessages();

  const propertyNameMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.name]),
  );

  const columns = [
    {
      key: "templateKey" as const,
      header: "Template",
      render: (value: MessageTemplateResponse["templateKey"]) =>
        TEMPLATE_KEY_LABELS[value] ?? value,
    },
    {
      key: "triggerType" as const,
      header: "Trigger",
      render: (value: MessageTemplateResponse["triggerType"], row: MessageTemplateResponse) => {
        const label = triggerLabel[value] ?? value;
        return row.triggerDays ? `${label} (${row.triggerDays}d)` : label;
      },
    },
    {
      key: "propertyId" as const,
      header: "Property",
      render: (value: MessageTemplateResponse["propertyId"]) =>
        value ? (propertyNameMap[value] ?? "—") : "All (default)",
    },
    {
      key: "isActive" as const,
      header: "Status",
      render: (value: MessageTemplateResponse["isActive"]) => (
        <span className={value ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "subjectTemplate" as const,
      header: "Subject",
      render: (value: MessageTemplateResponse["subjectTemplate"]) => (
        <span className="max-w-48 truncate text-xs">{value}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Messages"
        description="Automated emails sent to guests based on booking events."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => processMessages.mutate()}
              disabled={processMessages.isPending}
            >
              <PlayIcon data-icon="inline-start" />
              {processMessages.isPending ? "Sending..." : "Process pending"}
            </Button>
            <Button variant="outline" onClick={() => seedDefaults.mutate()}>
              <MailIcon data-icon="inline-start" />
              Seed defaults
            </Button>
          </div>
        }
      />

      {processMessages.isSuccess && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Processed {processMessages.data.processed} message(s) — {processMessages.data.sent} sent,{" "}
          {processMessages.data.failed} failed
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {templates && (
        <DataTable
          columns={columns}
          data={templates}
          emptyMessage='No templates configured. Click "Seed defaults" to create the standard templates.'
        />
      )}
    </div>
  );
}
