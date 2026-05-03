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
  });

  async function onSubmit(data: TicketCreateFormData) {
    try {
      await createTicket.mutateAsync({
        propertyId: data.propertyId,
        listingId: data.listingId ?? null,
        description: data.description,
        priority: data.priority,
        dateScheduled: data.dateScheduled ?? null,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
      });
      addToast({ type: "success", message: "Ticket created" });
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
              {...register("propertyId")}
            />
            {errors.propertyId && (
              <p className="text-destructive text-body">{errors.propertyId.message}</p>
            )}
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-description">Description *</Label>
            <Textarea
              id="m-description"
              rows={3}
              placeholder="What's wrong?"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-body">{errors.description.message}</p>
            )}
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div className="space-y-base">
              <Label htmlFor="m-priority">Priority *</Label>
              <Select
                id="m-priority"
                options={[...TICKET_PRIORITY_OPTIONS]}
                {...register("priority")}
              />
              {errors.priority && (
                <p className="text-destructive text-body">{errors.priority.message}</p>
              )}
            </div>
            <div className="space-y-base">
              <Label htmlFor="m-cost">Cost (optional)</Label>
              <Input
                id="m-cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("cost")}
              />
            </div>
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-scheduled">Scheduled for (optional)</Label>
            <Input id="m-scheduled" type="datetime-local" {...register("dateScheduled")} />
          </div>

          <div className="space-y-base">
            <Label htmlFor="m-notes">Notes (optional)</Label>
            <Textarea
              id="m-notes"
              rows={2}
              placeholder="Anything else worth knowing"
              {...register("notes")}
            />
            {errors.notes && <p className="text-destructive text-body">{errors.notes.message}</p>}
          </div>

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
