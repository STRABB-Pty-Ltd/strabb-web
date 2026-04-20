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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDismissConflict, useUpdateBookingNotes } from "@/hooks/use-bookings";
import { formatInPropertyTimezone, getTimezoneAbbr } from "@/lib/date-utils";
import type { BookingResponse } from "@/lib/schemas/booking";

interface BookingDetailDialogProps {
  booking: BookingResponse;
  propertyTimezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailDialog({
  booking,
  propertyTimezone,
  open,
  onOpenChange,
}: BookingDetailDialogProps) {
  const [notes, setNotes] = useState(booking.notes ?? "");
  const updateNotes = useUpdateBookingNotes();
  const dismissConflict = useDismissConflict();

  const tz = propertyTimezone || "UTC";
  const tzAbbr = getTimezoneAbbr(booking.checkIn, tz);

  async function handleSaveNotes() {
    await updateNotes.mutateAsync({ id: booking.id, notes: notes || null });
  }

  async function handleDismissConflict() {
    await dismissConflict.mutateAsync(booking.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            {booking.source} booking — {booking.status}
            {booking.conflictStatus === "conflicted" && " (conflicted)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-sm text-body">
          {booking.conflictStatus === "conflicted" && (
            <div className="p-sm rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <p className="font-medium text-red-800 dark:text-red-200">Date conflict detected</p>
              <p className="text-muted-foreground mt-xs text-body">
                This booking overlaps with another booking on a different listing for the same
                property. Resolve the conflict on the booking platform.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-base"
                onClick={handleDismissConflict}
                disabled={dismissConflict.isPending}
              >
                {dismissConflict.isPending ? "Dismissing..." : "Dismiss conflict"}
              </Button>
            </div>
          )}

          <div className="gap-sm grid grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Check-in</Label>
              <p className="font-medium">{formatInPropertyTimezone(booking.checkIn, tz)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Check-out</Label>
              <p className="font-medium">{formatInPropertyTimezone(booking.checkOut, tz)}</p>
            </div>
          </div>

          <p className="text-muted-foreground text-body">Times shown in {tzAbbr}</p>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Platform</Label>
              <p>{booking.source}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <p>{booking.status}</p>
            </div>
          </div>

          {(booking.guestName || booking.guestEmail) && (
            <div>
              <Label className="text-muted-foreground">Guest</Label>
              <p>
                {booking.guestName}
                {booking.guestEmail && (
                  <span className="text-muted-foreground ml-xs">({booking.guestEmail})</span>
                )}
              </p>
            </div>
          )}

          {booking.externalBookingId && (
            <div>
              <Label className="text-muted-foreground">External ID</Label>
              <p className="text-body font-mono">{booking.externalBookingId}</p>
            </div>
          )}

          {booking.rawSummary && (
            <div>
              <Label className="text-muted-foreground">iCal Summary</Label>
              <p className="text-body">{booking.rawSummary}</p>
            </div>
          )}

          <div className="space-y-base">
            <Label htmlFor="booking-notes">Notes</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this booking..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSaveNotes}
            disabled={updateNotes.isPending || notes === (booking.notes ?? "")}
          >
            {updateNotes.isPending ? "Saving..." : "Save notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
