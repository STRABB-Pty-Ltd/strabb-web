"use client";

import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { ListingDeleteDialog } from "@/components/listings/listing-delete-dialog";
import { ListingFormDialog } from "@/components/listings/listing-form-dialog";
import { useListings } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { PLATFORM_OPTIONS, type ListingResponse } from "@/lib/schemas/listing";

const platformLabel = Object.fromEntries(PLATFORM_OPTIONS.map((p) => [p.value, p.label]));

export default function ListingsPage() {
  const [propertyFilter, setPropertyFilter] = useState<string>("");
  const { data: propertiesData } = useProperties();
  const { data, isLoading, error } = useListings({
    propertyId: propertyFilter || undefined,
  });
  const [deleteTarget, setDeleteTarget] = useState<ListingResponse | null>(null);

  const propertyFilterOptions = [
    { value: "", label: "All properties" },
    ...(propertiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const propertyNameMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.name]),
  );

  const columns = [
    { key: "name" as const, header: "Name" },
    {
      key: "propertyId" as const,
      header: "Property",
      render: (value: ListingResponse["propertyId"]) => propertyNameMap[value] ?? "—",
    },
    {
      key: "platform" as const,
      header: "Platform",
      render: (value: ListingResponse["platform"]) => platformLabel[value] ?? value,
    },
    {
      key: "syncStatus" as const,
      header: "Sync",
      render: (value: ListingResponse["syncStatus"]) => {
        const colors: Record<string, string> = {
          pending: "text-yellow-600 dark:text-yellow-400",
          synced: "text-green-700 dark:text-green-400",
          error: "text-destructive",
        };
        return <span className={colors[value] ?? "text-muted-foreground"}>{value}</span>;
      },
    },
    {
      key: "icalFeedUrl" as const,
      header: "iCal",
      render: (value: ListingResponse["icalFeedUrl"]) => (value ? "Connected" : "—"),
    },
    {
      key: "id" as const,
      header: "",
      render: (_: ListingResponse["id"], row: ListingResponse) => (
        <div className="flex justify-end gap-1">
          <ListingFormDialog
            listing={row}
            trigger={
              <Button variant="ghost" size="icon-xs" aria-label="Edit listing">
                <PencilIcon />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Delete listing"
            onClick={() => setDeleteTarget(row)}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description="Manage your listings and iCal feeds."
        actions={
          <ListingFormDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                Add listing
              </Button>
            }
          />
        }
      />

      <div className="flex items-center gap-4">
        <Select
          options={propertyFilterOptions}
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="w-60"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error.message}</p>}

      {data && (
        <DataTable
          columns={columns}
          data={data.data}
          emptyMessage="No listings yet. Add your first listing to start syncing bookings."
        />
      )}

      {deleteTarget && (
        <ListingDeleteDialog
          listing={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
