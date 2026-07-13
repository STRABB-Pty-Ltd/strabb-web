"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProperties } from "@/hooks/use-properties";
import {
  useAvailabilityBlocks,
  useCreateAvailabilityBlock,
  useDeleteAvailabilityBlock,
  useUpdateAvailabilityBlock,
} from "@/lib/api-hooks/availability-blocks-api";
import { ApiError } from "@/lib/api-client";
import { BLOCK_REASON_OPTIONS } from "@/lib/schemas/availability-block";
import { useAppStore } from "@/stores/app-store";

interface FormState {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  propertyId: "",
  startDate: "",
  endDate: "",
  reason: "owner_block",
  notes: "",
};

/** Store-driven drawer: create when blockId is null, edit otherwise.
 *  Mounted once in the app shell alongside the other overlays. */
export function AvailabilityBlockDrawer() {
  const drawerState = useAppStore((s) => s.availabilityBlockDrawer);
  const closeDrawer = useAppStore((s) => s.closeAvailabilityBlockDrawer);
  const addToast = useAppStore((s) => s.addToast);

  const open = drawerState?.open ?? false;
  const blockId = drawerState?.blockId ?? null;
  const isEdit = blockId !== null;

  const { data: propertiesData } = useProperties();
  // Edit mode needs the block's fields; the list endpoint is the read
  // surface (no GET-by-id). Gated on open so the shell-mounted drawer does
  // not fetch every block on every page for every user.
  const blocksQuery = useAvailabilityBlocks({}, { enabled: open });
  const blocks = blocksQuery.data;
  const create = useCreateAvailabilityBlock();
  const update = useUpdateAvailabilityBlock();
  const remove = useDeleteAvailabilityBlock();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const editingBlock = useMemo(
    () => (isEdit ? (blocks ?? []).find((b) => b.id === blockId) : undefined),
    [isEdit, blocks, blockId],
  );
  // Never show an editable empty form against a real block id: a save from
  // that state would PATCH-wipe the block's reason/notes.
  const editUnresolved = isEdit && !editingBlock;

  // A drawer left open while the user navigates pages is disorientating
  // and can silently reset mid-typing (shell re-render). Close on route
  // change.
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      lastPathname.current = pathname;
      if (open) closeDrawer();
    }
  }, [pathname, open, closeDrawer]);

  useEffect(() => {
    if (!open) return;
    if (editingBlock) {
      setForm({
        propertyId: editingBlock.propertyId,
        startDate: editingBlock.startDate.slice(0, 10),
        endDate: editingBlock.endDate.slice(0, 10),
        reason: editingBlock.reason,
        notes: editingBlock.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setConfirmingDelete(false);
  }, [open, editingBlock]);

  const properties = propertiesData?.data ?? [];
  const saving = create.isPending || update.isPending || remove.isPending;

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  const handleError = (err: unknown) => {
    const message =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Save failed";
    setError(message);
    addToast({ type: "error", message });
  };

  const validate = (): string | null => {
    if (!isEdit && !form.propertyId) return "Choose a property";
    if (!form.startDate || !form.endDate) return "Start and end dates are required";
    if (form.endDate <= form.startDate) return "End date must be after the start date";
    return null;
  };

  const handleSave = async () => {
    setError(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    try {
      if (isEdit && blockId) {
        await update.mutateAsync({
          id: blockId,
          data: {
            startDate: form.startDate,
            endDate: form.endDate,
            reason: form.reason,
            notes: form.notes.trim() || null,
          },
        });
        addToast({ type: "success", message: "Block updated" });
      } else {
        await create.mutateAsync({
          propertyId: form.propertyId,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
          notes: form.notes.trim() || null,
        });
        addToast({ type: "success", message: "Dates blocked" });
      }
      closeDrawer();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    if (!blockId) return;
    try {
      await remove.mutateAsync(blockId);
      addToast({ type: "success", message: "Block removed, dates reopened" });
      closeDrawer();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrawer}
      title={isEdit ? "Edit blocked dates" : "Block dates"}
    >
      {editUnresolved ? (
        <div className="space-y-sm">
          <p className="text-body" role={blocksQuery.isLoading ? "status" : "alert"}>
            {blocksQuery.isLoading
              ? "Loading block details…"
              : "This block could not be loaded. It may have been removed; close and refresh the calendar."}
          </p>
          <div className="gap-sm pt-sm flex items-center justify-end">
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-sm">
          <div>
            <label htmlFor="blk-property" className="text-body text-highlight-10 block font-medium">
              Property
            </label>
            <Select
              id="blk-property"
              value={form.propertyId}
              onChange={(e) => patch({ propertyId: e.target.value })}
              disabled={isEdit}
              placeholder="Choose a property"
              options={properties.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
          <DateField
            id="blk-start"
            label="Start date"
            value={form.startDate}
            onChange={(v) => patch({ startDate: v })}
          />
          <DateField
            id="blk-end"
            label="End date"
            value={form.endDate}
            onChange={(v) => patch({ endDate: v })}
          />
          <p className="text-caption text-neutral-60">
            The end date itself stays open: blocking 10 Aug to 13 Aug keeps the nights of the 10th,
            11th and 12th unavailable, like a check-out day.
          </p>
          <div>
            <label htmlFor="blk-reason" className="text-body text-highlight-10 block font-medium">
              Reason
            </label>
            <Select
              id="blk-reason"
              value={form.reason}
              onChange={(e) => patch({ reason: e.target.value })}
              options={[...BLOCK_REASON_OPTIONS]}
            />
          </div>
          <div>
            <label htmlFor="blk-notes" className="text-body text-highlight-10 block font-medium">
              Notes
            </label>
            <Textarea
              id="blk-notes"
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-body text-status-danger" role="alert">
              {error}
            </p>
          )}

          <div className="gap-sm pt-sm flex items-center justify-end">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmingDelete(true)}
                disabled={saving}
              >
                Remove block
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Close
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Block dates"}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Remove this block?"
        description="The blocked dates reopen for booking and connected channels are updated."
        confirmLabel="Remove block"
        destructive
        onConfirm={handleDelete}
      />
    </DrillDownPanel>
  );
}

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function DateField({ id, label, value, onChange }: DateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-body text-highlight-10 block font-medium">
        {label}
      </label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
