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
import { Textarea } from "@/components/ui/textarea";
import { useFormWithSchema } from "@/hooks/use-form-with-schema";
import { useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import {
  propertyCreateSchema,
  type PropertyCreateFormData,
  type PropertyResponse,
} from "@/lib/schemas/property";

const AUSTRALIAN_TIMEZONES = [
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
  { value: "Australia/Hobart", label: "Hobart (AEST/AEDT)" },
  { value: "Australia/Darwin", label: "Darwin (ACST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];

interface PropertyFormDialogProps {
  property?: PropertyResponse;
  trigger: React.ReactNode;
}

export function PropertyFormDialog({ property, trigger }: PropertyFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!property;

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithSchema(propertyCreateSchema, {
    name: property?.name ?? "",
    address: property?.address ?? "",
    timezone: property?.timezone ?? "Australia/Sydney",
    cleaningDurationMinutes: property?.cleaningDurationMinutes ?? 120,
    accessInstructions: property?.accessInstructions ?? "",
    notes: property?.notes ?? "",
    cleanerName: property?.cleanerName ?? "",
    cleanerEmail: property?.cleanerEmail ?? "",
    cleanerPhone: property?.cleanerPhone ?? "",
  });

  async function onSubmit(data: PropertyCreateFormData) {
    if (isEdit && property) {
      await updateProperty.mutateAsync({ id: property.id, data });
    } else {
      await createProperty.mutateAsync(data);
    }
    setOpen(false);
    reset();
  }

  const error = createProperty.error || updateProperty.error;

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
          <DialogTitle>{isEdit ? "Edit Property" : "Add Property"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your property details."
              : "Add a new property to manage listings and bookings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Beach House Byron Bay" {...register("name")} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main St, Byron Bay NSW" {...register("address")} />
            {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select id="timezone" options={AUSTRALIAN_TIMEZONES} {...register("timezone")} />
              {errors.timezone && (
                <p className="text-destructive text-sm">{errors.timezone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaningDurationMinutes">Cleaning time (min)</Label>
              <Input
                id="cleaningDurationMinutes"
                type="number"
                min={0}
                max={1440}
                {...register("cleaningDurationMinutes")}
              />
              {errors.cleaningDurationMinutes && (
                <p className="text-destructive text-sm">{errors.cleaningDurationMinutes.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessInstructions">Access instructions</Label>
            <Textarea
              id="accessInstructions"
              placeholder="Lockbox code, key location, etc."
              {...register("accessInstructions")}
            />
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Default Cleaner</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cleanerName">Name</Label>
                <Input id="cleanerName" placeholder="Cleaner name" {...register("cleanerName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cleanerEmail">Email</Label>
                <Input
                  id="cleanerEmail"
                  type="email"
                  placeholder="cleaner@example.com"
                  {...register("cleanerEmail")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cleanerPhone">Phone</Label>
                <Input
                  id="cleanerPhone"
                  type="tel"
                  placeholder="0400 000 000"
                  {...register("cleanerPhone")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes about this property"
              {...register("notes")}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error.message}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Add property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
