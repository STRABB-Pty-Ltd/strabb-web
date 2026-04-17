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
import { useDeleteProperty } from "@/hooks/use-properties";
import type { PropertyResponse } from "@/lib/schemas/property";

interface PropertyDeleteDialogProps {
  property: PropertyResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDeleteDialog({ property, open, onOpenChange }: PropertyDeleteDialogProps) {
  const deleteProperty = useDeleteProperty();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteProperty.mutateAsync(property.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete property");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete property</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{property.name}</strong>? This will also remove
            all associated listings and bookings. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-body">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteProperty.isPending}>
            {deleteProperty.isPending ? "Deleting..." : "Delete property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
