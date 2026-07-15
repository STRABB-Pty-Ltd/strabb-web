"use client";

import { TicketForm } from "@/components/tickets/ticket-form";
import { Drawer } from "@/components/ui/drawer";
import { Z } from "@/lib/z-index";

interface TicketDrawerProps {
  open: boolean;
  onClose: () => void;
  initialPropertyId?: string;
}

/* New-ticket form drawer, anchored just LEFT of the thread overlay (same
   width and top/bottom insets, offset right by one thread-panel-width plus
   two space-md gutters - the clamped width, not the raw --thread-width, so
   this stays flush against the thread panel's actual width below lg). It
   sits at the thread's layer, ABOVE the thread scrim, so it renders bright
   beside the thread rather than dimmed beneath it. isolate stops mousedown
   reaching the thread overlay's document-level click-outside, so clicks
   inside the form can never close the thread; Esc stays app-shell's to
   handle globally. Close via the X (or on successful create) so form input
   is never lost by an accidental outside click. */
export function TicketDrawer({ open, onClose, initialPropertyId }: TicketDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New ticket"
      closeLabel="Close ticket form"
      width="thread"
      animation="slide-left"
      scrim={false}
      zIndex={Z.THREAD}
      rightOffset="calc(var(--space-md) + var(--thread-panel-width) + var(--space-md))"
      closeOnEscape={false}
      isolate
    >
      <TicketForm onSuccess={onClose} initialPropertyId={initialPropertyId} />
    </Drawer>
  );
}
