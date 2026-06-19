"use client";

import { useState } from "react";

import { TicketForm } from "@/components/tickets/ticket-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            Log an issue against a property - assign a priority and (optionally) schedule it.
          </DialogDescription>
        </DialogHeader>

        <TicketForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
