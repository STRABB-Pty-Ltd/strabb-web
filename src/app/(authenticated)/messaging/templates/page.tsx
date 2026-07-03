"use client";

import { useMemo, useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectOption } from "@/components/ui/select";
import { useMessageTemplates, useSeedDefaults } from "@/hooks/use-messages";
import { useProperties } from "@/hooks/use-properties";
import { ApiError, isForbidden } from "@/lib/api-client";
import type { MessageTemplateResponse } from "@/lib/schemas/message";
import { useAppStore } from "@/stores/app-store";

import { TemplateFormDialog, type TemplateFormMode } from "./_components/template-form-dialog";
import { TemplatesList } from "./_components/templates-list";

export default function MessageTemplatesPage() {
  const addToast = useAppStore((s) => s.addToast);
  const { data: templates, isLoading, error } = useMessageTemplates();
  const { data: propertiesData } = useProperties();
  const seedDefaults = useSeedDefaults();

  const [dialog, setDialog] = useState<{ open: boolean; mode: TemplateFormMode }>({
    open: false,
    mode: { kind: "create" },
  });

  const propertyOptions: SelectOption[] = useMemo(
    () => (propertiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [propertiesData],
  );
  const propertyNameById = useMemo(
    () => Object.fromEntries((propertiesData?.data ?? []).map((p) => [p.id, p.name])),
    [propertiesData],
  );

  const openCreate = () => setDialog({ open: true, mode: { kind: "create" } });
  const openEdit = (template: MessageTemplateResponse) =>
    setDialog({ open: true, mode: { kind: "edit", template } });

  const handleSeed = () => {
    seedDefaults.mutate(undefined, {
      onSuccess: () => addToast({ type: "success", message: "Default templates created" }),
      onError: (err) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to seed default templates";
        addToast({ type: "error", message });
      },
    });
  };

  // A cleaner can reach this route (Automations is visible to all); the messages
  // API is owner/admin-only, so a 403 degrades quietly rather than erroring (B.4).
  if (isForbidden(error)) {
    return (
      <div className="p-md space-y-md">
        <PageHeader title="Message templates" />
        <p className="text-body text-highlight-10">
          You do not have access to messaging templates.
        </p>
      </div>
    );
  }

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Message templates"
        description="Author the automated guest messages sent on booking confirmation and before check-in."
        actions={
          templates && templates.length > 0 ? (
            <Button type="button" onClick={openCreate}>
              <MessageSquarePlus aria-hidden="true" />
              New template
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-xs" role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading templates</span>
          <Skeleton h={64} />
          <Skeleton h={64} />
          <Skeleton h={64} />
        </div>
      )}

      {!isLoading && templates && templates.length === 0 && (
        <EmptyState
          icon={MessageSquarePlus}
          title="No templates yet"
          description="Set up the three default templates to get started, then customise them."
          action={{
            label: seedDefaults.isPending ? "Setting up…" : "Set up default templates",
            onClick: handleSeed,
          }}
        />
      )}

      {!isLoading && templates && templates.length > 0 && (
        <TemplatesList
          templates={templates}
          propertyNameById={propertyNameById}
          onEdit={openEdit}
        />
      )}

      <TemplateFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        mode={dialog.mode}
        propertyOptions={propertyOptions}
      />
    </div>
  );
}
