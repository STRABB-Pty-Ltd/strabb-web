"use client";

import { useState } from "react";
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
import { checklistItemLabelSchema } from "@/lib/schemas/checklist-template";

import { EditableText } from "./editable-text";

// The minimal item shape the editor needs. Both a template's ChecklistItem and
// a property's PropertyChecklistItem satisfy it, so the same editor drives both.
export interface ChecklistEditorItem {
  id: string;
  label: string;
  description: string | null;
  position: number;
}

function ItemRow({
  item,
  onRename,
  onDescribe,
  onDelete,
  disabled,
}: {
  item: ChecklistEditorItem;
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

  // Keep rows compact: reveal the description field only while the row is being
  // edited (focus within it), but always show a description that already has
  // content so it stays visible and editable.
  const [rowFocused, setRowFocused] = useState(false);
  const hasDescription = (item.description ?? "").trim().length > 0;
  const showDescription = rowFocused || hasDescription;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="gap-sm flex items-start"
      onFocus={() => setRowFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRowFocused(false);
      }}
    >
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
        {showDescription && (
          <EditableText
            value={item.description ?? ""}
            ariaLabel={`Description for ${item.label}`}
            placeholder="Add a description (optional)"
            disabled={disabled}
            // Any text is valid; an empty description clears it (sent as null).
            validate={() => true}
            onCommit={(description) => onDescribe(item.id, description === "" ? null : description)}
          />
        )}
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

// Callback-driven editor for an ordered checklist of items: inline rename +
// optional description, delete, drag-to-reorder, and an add-item form, plus an
// empty state. The owner (a template or a property) binds its id into the
// callbacks, so this component is owner-agnostic.
export function ChecklistItemsEditor({
  items,
  busy,
  onAdd,
  onRename,
  onDescribe,
  onDelete,
  onReorder,
}: {
  items: ChecklistEditorItem[];
  busy: boolean;
  onAdd: (label: string, reset: () => void) => void;
  onRename: (itemId: string, label: string) => void;
  onDescribe: (itemId: string, description: string | null) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((item) => item.id));
  };

  return (
    <div className="space-y-sm">
      {items.length === 0 ? (
        <p className="text-body text-highlight-10">No items yet. Add the first one below.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-sm">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  disabled={busy}
                  onRename={onRename}
                  onDescribe={onDescribe}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <AddItemForm pending={busy} onAdd={onAdd} />
    </div>
  );
}
