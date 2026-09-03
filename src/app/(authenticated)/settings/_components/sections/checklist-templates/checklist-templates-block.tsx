"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";

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
  checklistItemLabelSchema,
  checklistTemplateNameSchema,
  type ChecklistItem,
  type ChecklistTemplate,
} from "@/lib/schemas/checklist-template";
import { useAppStore } from "@/stores/app-store";

// Surface the API detail (e.g. a 400/404 message) verbatim; fall back to a
// friendly generic for anything that is not a structured error.
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

// Inline-editable single-line text. Local draft so typing does not fire a
// request per keystroke; commits on blur (and Enter) when the value is valid
// (non-empty) and actually changed. Re-syncs when the server value changes.
function EditableText({
  value,
  onCommit,
  ariaLabel,
  disabled,
  validate,
  placeholder,
}: {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  validate: (candidate: string) => boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!validate(trimmed)) {
      setError(true);
      return;
    }
    setError(false);
    if (trimmed === value) return;
    onCommit(trimmed);
  };

  return (
    <Input
      aria-label={ariaLabel}
      aria-invalid={error}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setError(false);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function ItemRow({
  item,
  onRename,
  onDescribe,
  onDelete,
  disabled,
}: {
  item: ChecklistItem;
  onRename: (itemId: string, label: string) => void;
  onDescribe: (itemId: string, description: string | null) => void;
  onDelete: (itemId: string) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="gap-sm flex items-start">
      {/* dnd-kit drag activator: a raw button so the sortable listeners and
          activator ref attach directly (no ui/Button primitive fits here). */}
      {/* eslint-disable-next-line no-restricted-syntax */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="text-highlight-10 hover:bg-neutral-30 size-lg flex cursor-grab items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-[var(--ring)] active:cursor-grabbing disabled:opacity-50"
        aria-label={`Reorder ${item.label}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <div className="space-y-xs flex-1">
        <EditableText
          value={item.label}
          ariaLabel={`Checklist item ${item.label}`}
          disabled={disabled}
          validate={(candidate) => checklistItemLabelSchema.safeParse({ label: candidate }).success}
          onCommit={(label) => onRename(item.id, label)}
        />
        <EditableText
          value={item.description ?? ""}
          ariaLabel={`Description for ${item.label}`}
          placeholder="Add a description (optional)"
          disabled={disabled}
          // Any text is valid; an empty description clears it (sent as null).
          validate={() => true}
          onCommit={(description) => onDescribe(item.id, description === "" ? null : description)}
        />
      </div>
      <Button
        type="button"
        variant="quiet"
        size="icon"
        onClick={() => onDelete(item.id)}
        disabled={disabled}
        aria-label={`Delete item ${item.label}`}
      >
        <X size={16} />
      </Button>
    </div>
  );
}

function AddItemForm({
  onAdd,
  pending,
}: {
  onAdd: (label: string, reset: () => void) => void;
  pending: boolean;
}) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = checklistItemLabelSchema.safeParse({ label: label.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a checklist item");
      return;
    }
    setError(null);
    onAdd(parsed.data.label, () => setLabel(""));
  };

  return (
    <div className="gap-sm flex items-start">
      <div className="flex-1">
        <Input
          aria-label="New checklist item"
          value={label}
          disabled={pending}
          placeholder="Add an item"
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {error && <p className="text-destructive text-body mt-xs">{error}</p>}
      </div>
      <Button type="button" variant="outline" onClick={submit} disabled={pending}>
        <Plus size={16} aria-hidden="true" />
        Add
      </Button>
    </div>
  );
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = template.items;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(
      template.id,
      reordered.map((item) => item.id),
    );
  };

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

      <div className="space-y-sm">
        {template.items.length === 0 ? (
          <p className="text-body text-highlight-10">No items yet. Add the first one below.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={template.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-sm">
                {template.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    disabled={busy}
                    onRename={(itemId, label) => onRenameItem(template.id, itemId, label)}
                    onDescribe={(itemId, description) =>
                      onDescribeItem(template.id, itemId, description)
                    }
                    onDelete={(itemId) => onDeleteItem(template.id, itemId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <AddItemForm
          pending={busy}
          onAdd={(label, reset) => onAddItem(template.id, label, reset)}
        />
      </div>
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
