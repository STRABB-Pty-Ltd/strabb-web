"use client";

import { EyeIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { BookingDetailDialog } from "@/components/bookings/booking-detail-dialog";
import { useBookings } from "@/hooks/use-bookings";
import { useProperties } from "@/hooks/use-properties";
import { formatDateInTimezone } from "@/lib/date-utils";
import {
  BOOKING_STATUS_OPTIONS,
  CONFLICT_STATUS_OPTIONS,
  type BookingFilters,
  type BookingResponse,
} from "@/lib/schemas/booking";
import { PLATFORM_OPTIONS } from "@/lib/schemas/listing";

const platformLabel = Object.fromEntries(PLATFORM_OPTIONS.map((p) => [p.value, p.label]));

export default function BookingsPage() {
  const [filters, setFilters] = useState<BookingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);

  const { data: propertiesData } = useProperties();
  const { data, isLoading, error } = useBookings(filters);

  const propertyOptions = [
    { value: "", label: "All properties" },
    ...(propertiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const platformFilterOptions = [
    { value: "", label: "All platforms" },
    ...PLATFORM_OPTIONS.map((p) => ({ value: p.value, label: p.label })),
  ];

  const propertyTimezoneMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.timezone]),
  );

  const propertyNameMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.name]),
  );

  function updateFilter(key: keyof BookingFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const columns = [
    {
      key: "checkIn" as const,
      header: "Check-in",
      render: (value: BookingResponse["checkIn"], row: BookingResponse) => {
        const tz = propertyTimezoneMap[row.propertyId] ?? "UTC";
        return formatDateInTimezone(value, tz);
      },
    },
    {
      key: "checkOut" as const,
      header: "Check-out",
      render: (value: BookingResponse["checkOut"], row: BookingResponse) => {
        const tz = propertyTimezoneMap[row.propertyId] ?? "UTC";
        return formatDateInTimezone(value, tz);
      },
    },
    {
      key: "propertyId" as const,
      header: "Property",
      render: (value: BookingResponse["propertyId"]) => propertyNameMap[value] ?? "—",
    },
    {
      key: "source" as const,
      header: "Platform",
      render: (value: BookingResponse["source"]) => platformLabel[value] ?? value,
    },
    {
      key: "guestName" as const,
      header: "Guest",
      render: (value: BookingResponse["guestName"]) => value ?? "—",
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: BookingResponse["status"], row: BookingResponse) => {
        const statusColors: Record<string, string> = {
          confirmed: "text-green-700 dark:text-green-400",
          cancelled: "text-muted-foreground line-through",
          pending: "text-yellow-600 dark:text-yellow-400",
        };
        return (
          <div className="flex items-center gap-2">
            <span className={statusColors[value] ?? ""}>{value}</span>
            {row.conflictStatus === "conflicted" && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                conflict
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "id" as const,
      header: "",
      render: (_: BookingResponse["id"], row: BookingResponse) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View booking"
            onClick={() => setSelectedBooking(row)}
          >
            <EyeIcon />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="View and manage synced bookings." />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          options={propertyOptions}
          value={filters.propertyId ?? ""}
          onChange={(e) => updateFilter("propertyId", e.target.value)}
          className="w-48"
        />
        <Select
          options={platformFilterOptions}
          value={filters.platform ?? ""}
          onChange={(e) => updateFilter("platform", e.target.value)}
          className="w-40"
        />
        <Select
          options={[...BOOKING_STATUS_OPTIONS]}
          value={filters.status ?? ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-36"
        />
        <Select
          options={[...CONFLICT_STATUS_OPTIONS]}
          value={filters.conflictStatus ?? ""}
          onChange={(e) => updateFilter("conflictStatus", e.target.value)}
          className="w-32"
        />
        <Input
          type="date"
          placeholder="From"
          value={filters.dateFrom?.split("T")[0] ?? ""}
          onChange={(e) =>
            updateFilter("dateFrom", e.target.value ? `${e.target.value}T00:00:00Z` : "")
          }
          className="w-36"
        />
        <Input
          type="date"
          placeholder="To"
          value={filters.dateTo?.split("T")[0] ?? ""}
          onChange={(e) =>
            updateFilter("dateTo", e.target.value ? `${e.target.value}T23:59:59Z` : "")
          }
          className="w-36"
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
          emptyMessage="No bookings found. Sync your listings to import bookings."
        />
      )}

      {selectedBooking && (
        <BookingDetailDialog
          booking={selectedBooking}
          propertyTimezone={propertyTimezoneMap[selectedBooking.propertyId] ?? "UTC"}
          open={!!selectedBooking}
          onOpenChange={(open) => {
            if (!open) setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}
