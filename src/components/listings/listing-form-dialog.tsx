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
import { Select } from "@/components/ui/select";
import { useFormWithSchema } from "@/hooks/use-form-with-schema";
import { useCreateListing, useUpdateListing } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import {
  listingCreateSchema,
  PLATFORM_OPTIONS,
  type ListingCreateFormData,
  type ListingResponse,
} from "@/lib/schemas/listing";

interface ListingFormDialogProps {
  listing?: ListingResponse;
  defaultPropertyId?: string;
  trigger: React.ReactNode;
}

export function ListingFormDialog({ listing, defaultPropertyId, trigger }: ListingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!listing;

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
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
  } = useFormWithSchema(listingCreateSchema, {
    propertyId: listing?.propertyId ?? defaultPropertyId ?? "",
    name: listing?.name ?? "",
    platform: listing?.platform ?? "",
    externalListingId: listing?.externalListingId ?? "",
    icalFeedUrl: listing?.icalFeedUrl ?? "",
  });

  async function onSubmit(data: ListingCreateFormData) {
    if (isEdit && listing) {
      await updateListing.mutateAsync({
        id: listing.id,
        data: {
          name: data.name,
          platform: data.platform,
          externalListingId: data.externalListingId,
          icalFeedUrl: data.icalFeedUrl,
        },
      });
    } else {
      await createListing.mutateAsync(data);
    }
    setOpen(false);
    reset();
  }

  const error = createListing.error || updateListing.error;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Listing" : "Add Listing"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your listing details."
              : "Add a new listing to track bookings from a platform."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-sm">
          {!isEdit && (
            <div className="space-y-base">
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                id="propertyId"
                options={propertyOptions}
                placeholder="Select a property"
                {...register("propertyId")}
              />
              {errors.propertyId && (
                <p className="text-destructive text-body">{errors.propertyId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-base">
            <Label htmlFor="listing-name">Name *</Label>
            <Input id="listing-name" placeholder="Airbnb — Beach House" {...register("name")} />
            {errors.name && <p className="text-destructive text-body">{errors.name.message}</p>}
          </div>

          <div className="space-y-base">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              id="platform"
              options={[...PLATFORM_OPTIONS]}
              placeholder="Select a platform"
              {...register("platform")}
            />
            {errors.platform && (
              <p className="text-destructive text-body">{errors.platform.message}</p>
            )}
          </div>

          <div className="space-y-base">
            <Label htmlFor="externalListingId">External listing ID</Label>
            <Input
              id="externalListingId"
              placeholder="Platform-specific ID (optional)"
              {...register("externalListingId")}
            />
          </div>

          <div className="space-y-base">
            <Label htmlFor="icalFeedUrl">iCal feed URL</Label>
            <Input
              id="icalFeedUrl"
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/..."
              {...register("icalFeedUrl")}
            />
            {errors.icalFeedUrl && (
              <p className="text-destructive text-body">{errors.icalFeedUrl.message}</p>
            )}
          </div>

          {error && <p className="text-destructive text-body">{error.message}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Add listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
