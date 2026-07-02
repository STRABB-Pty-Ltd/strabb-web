"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/use-messages";
import { useFormWithSchema } from "@/hooks/use-form-with-schema";
import { ApiError } from "@/lib/api-client";
import {
  MESSAGE_TEMPLATE_TOKENS,
  messageTemplateFormSchema,
  renderTemplatePreview,
  TRIGGER_TYPE_OPTIONS,
  type MessageTemplateFormData,
  type MessageTemplateResponse,
} from "@/lib/schemas/message";
import { useAppStore } from "@/stores/app-store";

export type TemplateFormMode =
  | { kind: "create" }
  | { kind: "edit"; template: MessageTemplateResponse };

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TemplateFormMode;
  /** Property scope options (excluding the tenant-wide option, which is prepended). */
  propertyOptions: SelectOption[];
}

const SUBJECT_ID = "template-subject";
const BODY_ID = "template-body";

export function TemplateFormDialog({
  open,
  onOpenChange,
  mode,
  propertyOptions,
}: TemplateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode.kind === "edit" ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Compose the guest message. Use the tokens below - they are replaced with real booking
            details when the message sends.
          </DialogDescription>
        </DialogHeader>
        {/* Remount per target so react-hook-form picks up fresh defaults each open. */}
        {open && (
          <TemplateForm
            key={mode.kind === "edit" ? mode.template.id : "create"}
            mode={mode}
            propertyOptions={propertyOptions}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TemplateForm({
  mode,
  propertyOptions,
  onDone,
}: {
  mode: TemplateFormMode;
  propertyOptions: SelectOption[];
  onDone: () => void;
}) {
  const addToast = useAppStore((s) => s.addToast);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const isEdit = mode.kind === "edit";
  const existing = mode.kind === "edit" ? mode.template : null;

  // Which field the token chips insert into (last focused).
  const [activeField, setActiveField] = useState<"subjectTemplate" | "bodyTemplate">(
    "bodyTemplate",
  );

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormWithSchema(messageTemplateFormSchema, {
    templateKey: existing?.templateKey ?? "",
    propertyId: existing?.propertyId ?? "",
    subjectTemplate: existing?.subjectTemplate ?? "",
    bodyTemplate: existing?.bodyTemplate ?? "",
    triggerType:
      (existing?.triggerType as MessageTemplateFormData["triggerType"]) ?? "on_confirmation",
    triggerDays: existing?.triggerDays != null ? String(existing.triggerDays) : "",
    isActive: existing?.isActive ?? true,
  });

  const triggerType = watch("triggerType");
  const subjectPreview = renderTemplatePreview(watch("subjectTemplate") ?? "");
  const bodyPreview = renderTemplatePreview(watch("bodyTemplate") ?? "");

  const scopeOptions: SelectOption[] = [
    { value: "", label: "All properties (tenant-wide)" },
    ...propertyOptions,
  ];

  function insertToken(token: string) {
    const fieldName = activeField;
    const el = document.getElementById(fieldName === "subjectTemplate" ? SUBJECT_ID : BODY_ID) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    const current = getValues(fieldName) ?? "";
    const snippet = `{${token}}`;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + snippet + current.slice(end);
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
    // Restore focus + caret just after the inserted token.
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
        const caret = start + snippet.length;
        el.setSelectionRange(caret, caret);
      });
    }
  }

  async function onSubmit(data: MessageTemplateFormData) {
    const triggerDays =
      data.triggerType === "days_before_checkin" ? Number(data.triggerDays) : null;
    try {
      if (isEdit && existing) {
        await updateTemplate.mutateAsync({
          id: existing.id,
          data: {
            subjectTemplate: data.subjectTemplate,
            bodyTemplate: data.bodyTemplate,
            triggerType: data.triggerType,
            triggerDays,
            isActive: data.isActive,
          },
        });
        addToast({ type: "success", message: "Template updated" });
      } else {
        await createTemplate.mutateAsync({
          templateKey: data.templateKey,
          propertyId: data.propertyId || null,
          subjectTemplate: data.subjectTemplate,
          bodyTemplate: data.bodyTemplate,
          triggerType: data.triggerType,
          triggerDays,
          isActive: data.isActive,
        });
        addToast({ type: "success", message: "Template created" });
      }
      onDone();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save template";
      addToast({ type: "error", message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-sm">
      <div className="gap-sm grid grid-cols-2">
        <div className="space-y-base">
          <Label htmlFor="template-key">Template key *</Label>
          {isEdit ? (
            <p id="template-key" className="font-data text-body text-highlight-10 py-xs">
              {existing?.templateKey}
            </p>
          ) : (
            <Input
              id="template-key"
              placeholder="e.g. pre_arrival_reminder"
              aria-invalid={!!errors.templateKey}
              aria-describedby={errors.templateKey ? "template-key-error" : undefined}
              {...register("templateKey")}
            />
          )}
          {!isEdit && errors.templateKey && (
            <p id="template-key-error" className="text-destructive text-body">
              {errors.templateKey.message}
            </p>
          )}
        </div>

        <div className="space-y-base">
          <Label htmlFor="template-scope">Applies to *</Label>
          {isEdit ? (
            <p id="template-scope" className="text-body text-highlight-10 py-xs">
              {existing?.propertyId
                ? (propertyOptions.find((o) => o.value === existing.propertyId)?.label ??
                  "One property")
                : "All properties (tenant-wide)"}
            </p>
          ) : (
            <Select id="template-scope" options={scopeOptions} {...register("propertyId")} />
          )}
        </div>
      </div>

      <div className="space-y-base">
        <Label htmlFor={SUBJECT_ID}>Subject *</Label>
        <Input
          id={SUBJECT_ID}
          placeholder="e.g. Your stay at {property_name}"
          aria-invalid={!!errors.subjectTemplate}
          aria-describedby={errors.subjectTemplate ? "template-subject-error" : undefined}
          {...register("subjectTemplate")}
          onFocus={() => setActiveField("subjectTemplate")}
        />
        {errors.subjectTemplate && (
          <p id="template-subject-error" className="text-destructive text-body">
            {errors.subjectTemplate.message}
          </p>
        )}
      </div>

      <div className="space-y-base">
        <Label htmlFor={BODY_ID}>Body *</Label>
        <Textarea
          id={BODY_ID}
          rows={5}
          placeholder="Hi {guest_name}, ..."
          aria-invalid={!!errors.bodyTemplate}
          aria-describedby={errors.bodyTemplate ? "template-body-error" : undefined}
          {...register("bodyTemplate")}
          onFocus={() => setActiveField("bodyTemplate")}
        />
        {errors.bodyTemplate && (
          <p id="template-body-error" className="text-destructive text-body">
            {errors.bodyTemplate.message}
          </p>
        )}
      </div>

      <div className="space-y-base">
        <p className="text-body text-highlight-10 font-medium">
          Insert a token (into the last-focused field)
        </p>
        <div className="gap-xs flex flex-wrap">
          {MESSAGE_TEMPLATE_TOKENS.map((token) => (
            <Button
              key={token}
              type="button"
              variant="outline"
              size="xs"
              onClick={() => insertToken(token)}
            >
              {`{${token}}`}
            </Button>
          ))}
        </div>
      </div>

      <div className="gap-sm grid grid-cols-2">
        <div className="space-y-base">
          <Label htmlFor="template-trigger">Send *</Label>
          <Select
            id="template-trigger"
            options={[...TRIGGER_TYPE_OPTIONS]}
            {...register("triggerType")}
          />
        </div>
        {triggerType === "days_before_checkin" && (
          <div className="space-y-base">
            <Label htmlFor="template-days">Days before check-in *</Label>
            <Input
              id="template-days"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 2"
              aria-invalid={!!errors.triggerDays}
              aria-describedby={errors.triggerDays ? "template-days-error" : undefined}
              {...register("triggerDays")}
            />
            {errors.triggerDays && (
              <p id="template-days-error" className="text-destructive text-body">
                {errors.triggerDays.message}
              </p>
            )}
          </div>
        )}
      </div>

      <label className="gap-sm text-body text-highlight-10 flex items-center">
        <input
          type="checkbox"
          {...register("isActive")}
          className="h-base w-base border-neutral-30 rounded"
        />
        Active (sends automatically when the trigger fires)
      </label>

      <div className="space-y-base p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <p className="text-body text-highlight-10 font-semibold">Preview</p>
        <p className="text-body text-highlight-10">
          <span className="font-medium">Subject:</span> {subjectPreview || "-"}
        </p>
        <p className="text-body text-highlight-10 whitespace-pre-wrap">{bodyPreview || "-"}</p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Unknown tokens (typos) stay raw here - that is your cue they will not be replaced.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoadingSpinner className="border-primary-foreground h-sm w-sm border-t-transparent" />
              Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Create template"
          )}
        </Button>
      </div>
    </form>
  );
}
