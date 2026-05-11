"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormWithSchema } from "@/hooks/use-form-with-schema";
import { useProperties } from "@/hooks/use-properties";
import { ApiError } from "@/lib/api-client";
import { useCreateTicketAPI } from "@/lib/api-hooks/tickets-api";
import { ticketCreateSchema, type TicketCreateFormData } from "@/lib/schemas/ticket";
import { useAppStore } from "@/stores/app-store";
import { TICKET_PRIORITY_OPTIONS } from "@/types/ticket";

interface TicketFormDialogProps {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: TicketFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const addToast = useAppStore((s) => s.addToast);
  const createTicket = useCreateTicketAPI();
  const { data: propertiesData } = useProperties();

  const propertyOptions = (propertiesData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithSchema(ticketCreateSchema, {
    propertyId: "",
    listingId: "",
    description: "",
    priority: "medium",
    dateScheduled: "",
    cost: "",
    notes: "",
    autoLinkToNext: false,
  });

  async function onSubmit(data: TicketCreateFormData) {
    try {
      const result = await createTicket.mutateAsync({
        propertyId: data.propertyId,
        listingId: data.listingId ?? null,
        description: data.description,
        priority: data.priority,
        dateScheduled: data.dateScheduled ?? null,
        cost: data.cost ? parseFloat(data.cost) : null,
        notes: data.notes ?? null,
        autoLinkToNext: data.autoLinkToNext ?? false,
      });
      if (result.attemptedAutoLink && !result.linkedCleanId) {
        addToast({
          type: "info",
          message: "Ticket created - no clean found to link",
        });
      } else {
        addToast({ type: "success", message: "Ticket created" });
      }
      setOpen(false);
      reset();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create ticket";
      addToast({ type: "error", message });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            Log an issue against a property - assign a priority and (optionally) schedule it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-sm">
          <div className="space-y-base">
            <Label htmlFor="m-property">Property *</Label>
            <Select
              id="m-property"
              options={propertyOptions}
              placeholder="Select a property"
              aria-invalid={!!errors.propertyId}
              aria-describedby={errors.propertyId ? "m-property-error" : undefined}
              {...register("propertyId")}
            />
            {errors.propertyId && (
              <p id="m-property-error" className="text-destructive text-body">
                {errors.propertyId.message}
              </p>
            )}
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-description">Description *</Label>
            <Textarea
              id="m-description"
              rows={3}
              placeholder="What's wrong?"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "m-description-error" : undefined}
              {...register("description")}
            />
            {errors.description && (
              <p id="m-description-error" className="text-destructive text-body">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div className="space-y-base">
              <Label htmlFor="m-priority">Priority *</Label>
              <Select
                id="m-priority"
                options={[...TICKET_PRIORITY_OPTIONS]}
                aria-invalid={!!errors.priority}
                aria-describedby={errors.priority ? "m-priority-error" : undefined}
                {...register("priority")}
              />
              {errors.priority && (
                <p id="m-priority-error" className="text-destructive text-body">
                  {errors.priority.message}
                </p>
              )}
            </div>
            <div className="space-y-base">
              <Label htmlFor="m-cost">Cost (optional)</Label>
              <Input
                id="m-cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.cost}
                aria-describedby={errors.cost ? "m-cost-error" : undefined}
                {...register("cost")}
              />
              {errors.cost && (
                <p id="m-cost-error" className="text-destructive text-body">
                  {errors.cost.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-scheduled">Scheduled for (optional)</Label>
            <Input
              id="m-scheduled"
              type="datetime-local"
              aria-invalid={!!errors.dateScheduled}
              aria-describedby={errors.dateScheduled ? "m-scheduled-error" : undefined}
              {...register("dateScheduled")}
            />
            {errors.dateScheduled && (
              <p id="m-scheduled-error" className="text-destructive text-body">
                {errors.dateScheduled.message}
              </p>
            )}
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-notes">Notes (optional)</Label>
            <Textarea
              id="m-notes"
              rows={2}
              placeholder="Anything else worth knowing"
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "m-notes-error" : undefined}
              {...register("notes")}
            />
            {errors.notes && (
              <p id="m-notes-error" className="text-destructive text-body">
                {errors.notes.message}
              </p>
            )}
          </div>

          <label className="gap-sm text-body text-highlight-10 flex items-center">
            <input
              type="checkbox"
              {...register("autoLinkToNext")}
              className="h-base w-base border-neutral-30 rounded"
            />
            Auto-link to next scheduled clean for this listing
          </label>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="border-primary-foreground h-sm w-sm border-t-transparent" />
                  Creating…
                </>
              ) : (
                "Create ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
