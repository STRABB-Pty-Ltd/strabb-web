"use client";

import { AlertTriangleIcon, CalendarDaysIcon, HomeIcon, ListIcon } from "lucide-react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useBookings, useBookingSummary } from "@/hooks/use-bookings";
import { useListings } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { formatDateInTimezone } from "@/lib/date-utils";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  alert,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <div
      className={`rounded-xl border p-4 ${alert ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : "bg-card"}`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`size-5 ${alert ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
        />
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className={`text-xl font-semibold ${alert ? "text-red-700 dark:text-red-300" : ""}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}

export default function DashboardPage() {
  const { data: propertiesData, isLoading: propsLoading } = useProperties();
  const { data: listingsData, isLoading: listingsLoading } = useListings();
  const { data: summaryData, isLoading: summaryLoading } = useBookingSummary();
  const { data: recentBookingsData, isLoading: bookingsLoading } = useBookings({}, 1, 5);

  const isLoading = propsLoading || listingsLoading || summaryLoading || bookingsLoading;

  const propertyTimezoneMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.timezone]),
  );

  const propertyNameMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.name]),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your properties and bookings." />

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Properties"
              value={propertiesData?.meta.total ?? 0}
              icon={HomeIcon}
              href="/properties"
            />
            <StatCard
              label="Listings"
              value={listingsData?.meta.total ?? 0}
              icon={ListIcon}
              href="/listings"
            />
            <StatCard
              label="Bookings"
              value={summaryData?.totalBookings ?? 0}
              icon={CalendarDaysIcon}
              href="/bookings"
            />
            <StatCard
              label="Conflicts"
              value={summaryData?.activeConflicts ?? 0}
              icon={AlertTriangleIcon}
              href="/bookings?conflict_status=conflicted"
              alert={(summaryData?.activeConflicts ?? 0) > 0}
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium">Recent Bookings</h2>
            {(recentBookingsData?.data.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">
                No bookings yet. Add iCal feeds to your listings and sync to see bookings here.
              </p>
            ) : (
              <div className="divide-y rounded-xl border">
                {recentBookingsData?.data.map((booking) => {
                  const tz = propertyTimezoneMap[booking.propertyId] ?? "UTC";
                  return (
                    <Link
                      key={booking.id}
                      href="/bookings"
                      className="hover:bg-muted/50 flex items-center justify-between px-4 py-3 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {booking.guestName ?? "Guest"} —{" "}
                          {propertyNameMap[booking.propertyId] ?? "Unknown"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateInTimezone(booking.checkIn, tz)} →{" "}
                          {formatDateInTimezone(booking.checkOut, tz)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            booking.status === "confirmed"
                              ? "text-green-700 dark:text-green-400"
                              : booking.status === "cancelled"
                                ? "text-muted-foreground"
                                : "text-yellow-600"
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.conflictStatus === "conflicted" && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                            conflict
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
