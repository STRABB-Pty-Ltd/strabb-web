"use client";

import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyDeleteDialog } from "@/components/properties/property-delete-dialog";
import { PropertyFormDialog } from "@/components/properties/property-form-dialog";
import { useProperties } from "@/hooks/use-properties";
import type { PropertyResponse } from "@/lib/schemas/property";

export default function PropertiesPage() {
  const { data, isLoading, error } = useProperties();
  const [deleteTarget, setDeleteTarget] = useState<PropertyResponse | null>(null);

  const columns = [
    { key: "name" as const, header: "Name" },
    { key: "address" as const, header: "Address" },
    { key: "timezone" as const, header: "Timezone" },
    {
      key: "cleaningDurationMinutes" as const,
      header: "Cleaning",
      render: (value: PropertyResponse["cleaningDurationMinutes"]) => `${value} min`,
    },
    {
      key: "isActive" as const,
      header: "Status",
      render: (value: PropertyResponse["isActive"]) => (
        <span className={value ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "id" as const,
      header: "",
      render: (_: PropertyResponse["id"], row: PropertyResponse) => (
        <div className="flex justify-end gap-1">
          <PropertyFormDialog
            property={row}
            trigger={
              <Button variant="ghost" size="icon-xs" aria-label="Edit property">
                <PencilIcon />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Delete property"
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
        title="Properties"
        description="Manage your rental properties."
        actions={
          <PropertyFormDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                Add property
              </Button>
            }
          />
        }
      />

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
          emptyMessage="No properties yet. Add your first property to get started."
        />
      )}

      {deleteTarget && (
        <PropertyDeleteDialog
          property={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
