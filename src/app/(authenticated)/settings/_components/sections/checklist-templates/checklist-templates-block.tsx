"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { ChecklistItemsEditor } from "@/components/checklists/checklist-items-editor";
import { EditableText } from "@/components/checklists/editable-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChecklistTemplates } from "@/hooks/use-checklist-templates";
import {
  useAddItem,
  useCreateTemplate,
  useDeleteItem,
  useDeleteTemplate,
  useRenameTemplate,
  useReorderItems,
  useUpdateItem,
} from "@/lib/api-hooks/checklist-templates-api";
import { ApiError } from "@/lib/api-client";
import {
  checklistTemplateNameSchema,
  type ChecklistTemplate,
} from "@/lib/schemas/checklist-template";
import { useAppStore } from "@/stores/app-store";

// Surface the API detail (e.g. a 400/404 message) verbatim; fall back to a
// friendly generic for anything that is not a structured error.
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

function TemplateCard({
  template,
  onRename,
  onDelete,
  onAddItem,
  onRenameItem,
  onDescribeItem,
  onDeleteItem,
  onReorder,
  busy,
}: {
  template: ChecklistTemplate;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onAddItem: (templateId: string, label: string, reset: () => void) => void;
  onRenameItem: (templateId: string, itemId: string, label: string) => void;
  onDescribeItem: (templateId: string, itemId: string, description: string | null) => void;
  onDeleteItem: (templateId: string, itemId: string) => void;
  onReorder: (templateId: string, itemIds: string[]) => void;
  busy: boolean;
}) {
  return (
    <div className="p-sm space-y-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <div className="gap-sm flex items-center justify-between">
        <div className="flex-1">
          <EditableText
            value={template.name}
            ariaLabel={`Template name ${template.name}`}
            disabled={busy}
            validate={(candidate) =>
              checklistTemplateNameSchema.safeParse({ name: candidate }).success
            }
            onCommit={(name) => onRename(template.id, name)}
          />
        </div>
        <span className="text-body text-highlight-10 whitespace-nowrap">
          {template.items.length} {template.items.length === 1 ? "item" : "items"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onDelete(template.id, template.name)}
          disabled={busy}
        >
          Delete
        </Button>
      </div>

      <ChecklistItemsEditor
        items={template.items}
        busy={busy}
        onAdd={(label, reset) => onAddItem(template.id, label, reset)}
        onRename={(itemId, label) => onRenameItem(template.id, itemId, label)}
        onDescribe={(itemId, description) => onDescribeItem(template.id, itemId, description)}
        onDelete={(itemId) => onDeleteItem(template.id, itemId)}
        onReorder={(itemIds) => onReorder(template.id, itemIds)}
      />
    </div>
  );
}

export function ChecklistTemplatesBlock() {
  const addToast = useAppStore((s) => s.addToast);

  const templatesQuery = useChecklistTemplates();
  const templates = templatesQuery.data?.data ?? [];

  const createTemplate = useCreateTemplate();
  const renameTemplate = useRenameTemplate();
  const deleteTemplate = useDeleteTemplate();
  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const reorderItems = useReorderItems();

  // A single set of mutation hooks serves the whole block, so any in-flight
  // write disables the editing controls (mirrors the Team section).
  const busy =
    renameTemplate.isPending ||
    deleteTemplate.isPending ||
    addItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending;

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = () => {
    const parsed = checklistTemplateNameSchema.safeParse({ name: newName.trim() });
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Enter a template name");
      return;
    }
    setCreateError(null);
    createTemplate.mutate(
      { name: parsed.data.name },
      {
        onSuccess: () => {
          addToast({ type: "success", message: `Template "${parsed.data.name}" created` });
          setNewName("");
          setShowCreate(false);
        },
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to create template") }),
      },
    );
  };

  const handleRename = (id: string, name: string) => {
    renameTemplate.mutate(
      { id, name },
      {
        onSuccess: () => addToast({ type: "success", message: "Template renamed" }),
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to rename template") }),
      },
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: `Template "${name}" deleted` }),
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to delete template") }),
    });
  };

  const handleAddItem = (templateId: string, label: string, reset: () => void) => {
    addItem.mutate(
      { templateId, label },
      {
        onSuccess: () => reset(),
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to add item") }),
      },
    );
  };

  const handleRenameItem = (templateId: string, itemId: string, label: string) => {
    updateItem.mutate(
      { templateId, itemId, label },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update item") }),
      },
    );
  };

  const handleDescribeItem = (templateId: string, itemId: string, description: string | null) => {
    updateItem.mutate(
      { templateId, itemId, description },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update description") }),
      },
    );
  };

  const handleDeleteItem = (templateId: string, itemId: string) => {
    deleteItem.mutate(
      { templateId, itemId },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to delete item") }),
      },
    );
  };

  const handleReorder = (templateId: string, itemIds: string[]) => {
    // The optimistic cache update in the mutation already reflects the new
    // order; only surface an error (which also rolls the order back).
    reorderItems.mutate(
      { templateId, itemIds },
      {
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to reorder items") }),
      },
    );
  };

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-body text-highlight-10 font-semibold">Checklist Templates</h3>
          <p className="text-body text-highlight-10">
            Reusable checklists a cleaner works through on a clean.
          </p>
        </div>
        {!showCreate && (
          <Button type="button" variant="outline" size="xs" onClick={() => setShowCreate(true)}>
            <Plus size={16} aria-hidden="true" />
            Add template
          </Button>
        )}
      </div>

      {showCreate && (
        <div
          className="gap-sm p-sm bg-neutral-30 flex items-end rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1">
            <label
              htmlFor="checklist-template-name"
              className="mb-xs text-body text-highlight-10 block font-medium"
            >
              Template name
            </label>
            <Input
              id="checklist-template-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Standard Checkout Clean"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            {createError && <p className="text-destructive text-body mt-xs">{createError}</p>}
          </div>
          <Button type="button" onClick={handleCreate} disabled={createTemplate.isPending}>
            {createTemplate.isPending ? "Creating…" : "Create"}
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="icon"
            onClick={() => {
              setShowCreate(false);
              setCreateError(null);
              setNewName("");
            }}
            aria-label="Cancel new template"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {templatesQuery.isLoading ? (
        <p className="text-body text-highlight-10">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-body text-highlight-10">
          No checklist templates yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-sm">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              busy={busy}
              onRename={handleRename}
              onDelete={handleDelete}
              onAddItem={handleAddItem}
              onRenameItem={handleRenameItem}
              onDescribeItem={handleDescribeItem}
              onDeleteItem={handleDeleteItem}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
