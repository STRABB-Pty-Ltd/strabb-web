"use client";

import { useState } from "react";

import { ChecklistItemsEditor } from "@/components/checklists/checklist-items-editor";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useChecklistTemplates } from "@/hooks/use-checklist-templates";
import { useDefaultChecklist } from "@/hooks/use-default-checklist";
import {
  useAddPropertyItem,
  useApplyTemplate,
  useDeletePropertyItem,
  useReorderPropertyItems,
  useUpdatePropertyItem,
} from "@/lib/api-hooks/property-checklist-api";
import { ApiError } from "@/lib/api-client";
import { useAppStore } from "@/stores/app-store";

// Surface the API detail verbatim; fall back to a friendly generic otherwise.
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

// A property's default cleaning checklist, edited in the Listings General tab.
// The checklist is its own resource - it saves itself as you edit, independent
// of the property's other settings. "Set from a template" appends a copy of a
// template's items (non-destructive), after which they are edited independently.
export function PropertyChecklistBlock({ propertyId }: { propertyId: string }) {
  const addToast = useAppStore((s) => s.addToast);

  const checklistQuery = useDefaultChecklist(propertyId);
  const items = checklistQuery.data?.data ?? [];

  const templatesQuery = useChecklistTemplates();
  const templates = templatesQuery.data?.data ?? [];

  const addItem = useAddPropertyItem();
  const updateItem = useUpdatePropertyItem();
  const deleteItem = useDeletePropertyItem();
  const reorderItems = useReorderPropertyItems();
  const applyTemplate = useApplyTemplate();

  // Any in-flight item write disables the editing controls (mirrors the
  // template editor). Reorder is optimistic, so it stays out of this flag.
  const busy = addItem.isPending || updateItem.isPending || deleteItem.isPending;

  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const handleAdd = (label: string, reset: () => void) => {
    addItem.mutate(
      { propertyId, label },
      {
        onSuccess: () => reset(),
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to add item") }),
      },
    );
  };

  const handleRename = (itemId: string, label: string) => {
    updateItem.mutate(
      { propertyId, itemId, label },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update item") }),
      },
    );
  };

  const handleDescribe = (itemId: string, description: string | null) => {
    updateItem.mutate(
      { propertyId, itemId, description },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update description") }),
      },
    );
  };

  const handleDelete = (itemId: string) => {
    deleteItem.mutate(
      { propertyId, itemId },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to delete item") }),
      },
    );
  };

  const handleReorder = (itemIds: string[]) => {
    reorderItems.mutate(
      { propertyId, itemIds },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to reorder items") }),
      },
    );
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    const template = templates.find((t) => t.id === selectedTemplateId);
    applyTemplate.mutate(
      { propertyId, templateId: selectedTemplateId },
      {
        onSuccess: () => {
          const count = template?.items.length ?? 0;
          addToast({
            type: "success",
            message: `Added ${count} ${count === 1 ? "item" : "items"} from "${template?.name ?? "template"}"`,
          });
          setSelectedTemplateId("");
        },
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to apply template") }),
      },
    );
  };

  return (
    <section className="space-y-sm">
      <div>
        <h3 className="text-body text-highlight-10 font-semibold">Cleaning checklist</h3>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          A cleaner works through this on a clean. Shared across every listing on this property.
        </p>
      </div>

      {templates.length > 0 && (
        <div className="gap-sm flex items-end">
          <div className="flex-1">
            <label
              htmlFor={`apply-template-${propertyId}`}
              className="mb-xs text-body text-highlight-10 block font-medium"
            >
              Set from a template
            </label>
            <Select
              id={`apply-template-${propertyId}`}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              options={[
                { value: "", label: "Choose a template..." },
                ...templates.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || applyTemplate.isPending}
          >
            {applyTemplate.isPending ? "Adding..." : "Add to checklist"}
          </Button>
        </div>
      )}

      {checklistQuery.isLoading ? (
        <p className="text-body text-highlight-10">Loading checklist...</p>
      ) : (
        <ChecklistItemsEditor
          items={items}
          busy={busy}
          onAdd={handleAdd}
          onRename={handleRename}
          onDescribe={handleDescribe}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      )}
    </section>
  );
}
