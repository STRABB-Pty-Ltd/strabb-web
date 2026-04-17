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
import { useDeleteListing } from "@/hooks/use-listings";
import type { ListingResponse } from "@/lib/schemas/listing";

interface ListingDeleteDialogProps {
  listing: ListingResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListingDeleteDialog({ listing, open, onOpenChange }: ListingDeleteDialogProps) {
  const deleteListing = useDeleteListing();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteListing.mutateAsync(listing.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete listing");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{listing.name}</strong>? Associated bookings
            will also be removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-body">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteListing.isPending}>
            {deleteListing.isPending ? "Deleting..." : "Delete listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
