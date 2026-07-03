"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDeleteTemplate, useUpdateTemplate } from "@/hooks/use-messages";
import { ApiError } from "@/lib/api-client";
import { formatTriggerLabel, type MessageTemplateResponse } from "@/lib/schemas/message";
import { useAppStore } from "@/stores/app-store";

interface TemplatesListProps {
  templates: MessageTemplateResponse[];
  propertyNameById: Record<string, string>;
  onEdit: (template: MessageTemplateResponse) => void;
}

export function TemplatesList({ templates, propertyNameById, onEdit }: TemplatesListProps) {
  const tenantWide = templates.filter((t) => t.propertyId === null);
  const perProperty = templates.filter((t) => t.propertyId !== null);

  return (
    <div className="space-y-md">
      <TemplateGroup
        heading="Tenant-wide defaults"
        description="Apply to every property unless a property-specific template overrides them."
        templates={tenantWide}
        propertyNameById={propertyNameById}
        onEdit={onEdit}
      />
      <TemplateGroup
        heading="Property-specific"
        description="Override the tenant-wide default for a single property."
        templates={perProperty}
        propertyNameById={propertyNameById}
        onEdit={onEdit}
      />
    </div>
  );
}

function TemplateGroup({
  heading,
  description,
  templates,
  propertyNameById,
  onEdit,
}: {
  heading: string;
  description: string;
  templates: MessageTemplateResponse[];
  propertyNameById: Record<string, string>;
  onEdit: (template: MessageTemplateResponse) => void;
}) {
  return (
    <section className="space-y-sm">
      <div>
        <h3 className="text-body text-highlight-10 font-semibold">{heading}</h3>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
      {templates.length === 0 ? (
        <p className="text-body text-highlight-10">None yet.</p>
      ) : (
        <ul className="space-y-xs">
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              propertyName={
                template.propertyId
                  ? (propertyNameById[template.propertyId] ?? "One property")
                  : null
              }
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TemplateRow({
  template,
  propertyName,
  onEdit,
}: {
  template: MessageTemplateResponse;
  propertyName: string | null;
  onEdit: (template: MessageTemplateResponse) => void;
}) {
  const addToast = useAppStore((s) => s.addToast);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const showError = (err: unknown, fallback: string) => {
    const message =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
    addToast({ type: "error", message });
  };

  const handleToggleActive = () => {
    updateTemplate.mutate(
      { id: template.id, data: { isActive: !template.isActive } },
      {
        onSuccess: () =>
          addToast({
            type: "success",
            message: template.isActive ? "Template disabled" : "Template enabled",
          }),
        onError: (err) => showError(err, "Failed to update template"),
      },
    );
  };

  const handleDelete = () => {
    deleteTemplate.mutate(template.id, {
      onSuccess: () => addToast({ type: "success", message: "Template deleted" }),
      onError: (err) => showError(err, "Failed to delete template"),
    });
  };

  const canDelete = template.propertyId !== null;

  return (
    <li
      className="p-sm gap-sm flex items-center justify-between rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="min-w-0">
        <p className="text-body text-highlight-10 font-medium">
          <span className="font-data">{template.templateKey}</span>
          {propertyName && (
            <span className="ml-xs" style={{ color: "var(--text-secondary)" }}>
              · {propertyName}
            </span>
          )}
        </p>
        <p className="text-body text-highlight-10 truncate">{template.subjectTemplate}</p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          {formatTriggerLabel(template.triggerType, template.triggerDays)}
        </p>
      </div>

      <div className="gap-xs flex shrink-0 items-center">
        <Button
          type="button"
          variant={template.isActive ? "secondary" : "outline"}
          size="xs"
          onClick={handleToggleActive}
          disabled={updateTemplate.isPending}
          aria-pressed={template.isActive}
        >
          {template.isActive ? "Active" : "Inactive"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(template)}
          aria-label={`Edit ${template.templateKey}`}
        >
          <Pencil aria-hidden="true" />
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
            aria-label={`Delete ${template.templateKey}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
    </li>
  );
}
