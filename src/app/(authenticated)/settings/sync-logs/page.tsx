"use client";

import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { type Column, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useSyncLogs, useTriggerSync } from "@/hooks/use-sync";
import { ApiError } from "@/lib/api-client";
import type { SyncLogResponse } from "@/lib/schemas/admin";
import { useAppStore } from "@/stores/app-store";

const PAGE_SIZE = 20;
const RATE_LIMIT_TOOLTIP = "Limited to 3 syncs per 5 minutes";

const statusColors: Record<string, string> = {
  success: "var(--status-completed)",
  partial: "var(--status-issues)",
  failed: "var(--status-danger)",
  running: "var(--status-in-progress)",
};

export default function SyncLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSyncLogs(page, PAGE_SIZE);
  const trigger = useTriggerSync();
  const addToast = useAppStore((s) => s.addToast);

  const handleTrigger = () => {
    trigger.mutate(undefined, {
      onSuccess: (result) => {
        addToast({
          type: "success",
          message: `Sync complete - ${result.listingsSynced} listings, ${result.bookingsCreated} new bookings, ${result.conflictsDetected} conflicts.`,
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to trigger sync";
        addToast({ type: "error", message });
      },
    });
  };

  const columns: Column<SyncLogResponse>[] = [
    {
      key: "startedAt",
      header: "Started",
      render: (_v, row) => (
        <span className="font-data text-body">
          {format(new Date(row.startedAt), "d MMM yyyy, HH:mm:ss")}
        </span>
      ),
    },
    {
      key: "listingId",
      header: "Listing",
      render: (_v, row) => (
        <span className="font-data text-body" title={row.listingId}>
          {row.listingId.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_v, row) => {
        // statusColors are NON-flipping (success green, danger red, etc.) so
        // text-on-color is the right pairing. If the API returns a status we
        // don't have a colour for, we fall back to brand-10 (FLIPPING) which
        // needs text-white instead - same pattern as other status chips.
        const matched = statusColors[row.status];
        return (
          <span
            className={`px-base py-xs text-body rounded-md font-medium ${
              matched ? "text-text-on-color" : "text-white"
            }`}
            style={{ backgroundColor: matched ?? "var(--brand-10)" }}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "bookingsCreated",
      header: "Bookings (new / updated / unchanged)",
      render: (_v, row) => (
        <span className="font-data text-body">
          {row.bookingsCreated} / {row.bookingsUpdated} / {row.bookingsUnchanged}
        </span>
      ),
    },
    {
      key: "completedAt",
      header: "Completed",
      render: (_v, row) => (
        <span className="font-data text-body text-gray-500">
          {row.completedAt ? format(new Date(row.completedAt), "HH:mm:ss") : "-"}
        </span>
      ),
    },
    {
      key: "errorMessage",
      header: "Error",
      render: (_v, row) => (
        <span className="text-body truncate text-gray-600">{row.errorMessage ?? "-"}</span>
      ),
    },
  ];

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Sync logs"
        description="Calendar sync history across all listings, newest first."
        actions={
          <button
            type="button"
            onClick={handleTrigger}
            disabled={trigger.isPending}
            title={RATE_LIMIT_TOOLTIP}
            className="gap-xs px-sm py-base text-body inline-flex items-center rounded-lg font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            <RefreshCw size={14} className={trigger.isPending ? "animate-spin" : undefined} />
            {trigger.isPending ? "Syncing…" : "Trigger sync"}
          </button>
        }
      />

      <p className="text-body text-gray-500">{RATE_LIMIT_TOOLTIP}.</p>

      {isLoading ? (
        <p className="text-body text-gray-400">Loading sync logs…</p>
      ) : (
        <div className="space-y-sm">
          <DataTable<SyncLogResponse>
            columns={columns}
            data={logs}
            emptyMessage="No sync runs yet. Hit Trigger sync above to fetch the latest from your channels."
          />
          {meta && <Pagination meta={meta} page={page} onChange={setPage} />}
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  page: number;
  onChange: (page: number) => void;
}

function Pagination({ meta, page, onChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="gap-base text-body flex items-center justify-end text-gray-500">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-sm py-xs rounded-lg border disabled:opacity-40"
        style={{ borderColor: "var(--border)" }}
      >
        Prev
      </button>
      <span>
        Page {page} of {meta.totalPages} · {meta.total} total
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(meta.totalPages, page + 1))}
        disabled={page >= meta.totalPages}
        className="px-sm py-xs rounded-lg border disabled:opacity-40"
        style={{ borderColor: "var(--border)" }}
      >
        Next
      </button>
    </div>
  );
}
