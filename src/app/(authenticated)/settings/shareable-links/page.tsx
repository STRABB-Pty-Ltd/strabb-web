"use client";

import { format } from "date-fns";
import { Copy, Link2, Trash2 } from "lucide-react";
import { useState } from "react";

import { type Column, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  useRevokeShareableLink,
  useShareableLinks,
  type ShareableLink,
} from "@/lib/api-hooks/share-api";
import { ApiError } from "@/lib/api-client";
import { useAppStore } from "@/stores/app-store";

export default function ShareableLinksPage() {
  const { data, isLoading } = useShareableLinks();
  const revoke = useRevokeShareableLink();
  const addToast = useAppStore((s) => s.addToast);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const links = data ?? [];

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      addToast({ type: "success", message: "Link copied to clipboard" });
    } catch {
      addToast({ type: "error", message: "Failed to copy link" });
    }
  };

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    revoke.mutate(id, {
      onSuccess: () => {
        addToast({ type: "success", message: "Link revoked" });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to revoke link";
        addToast({ type: "error", message });
      },
      onSettled: () => {
        setRevokingId(null);
      },
    });
  };

  const columns: Column<ShareableLink>[] = [
    {
      key: "menu",
      header: "Menu",
      render: (_v, row) => <span className="text-body capitalize">{row.menu}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (_v, row) => (
        <span className="font-data text-body">
          {format(new Date(row.createdAt), "d MMM yyyy, HH:mm")}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      render: (_v, row) => (
        <span className="font-data text-body text-highlight-10">
          {row.expiresAt ? format(new Date(row.expiresAt), "d MMM yyyy") : "Never"}
        </span>
      ),
    },
    {
      key: "lastAccessedAt",
      header: "Last accessed",
      render: (_v, row) => (
        <span className="font-data text-body text-highlight-10">
          {row.lastAccessedAt ? format(new Date(row.lastAccessedAt), "d MMM yyyy, HH:mm") : "-"}
        </span>
      ),
    },
    {
      key: "publicUrl",
      header: "Public URL",
      render: (_v, row) => (
        <div className="gap-xs flex items-center">
          <span className="font-data text-body truncate" title={row.publicUrl}>
            {row.publicUrl}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(row.publicUrl)}
            aria-label="Copy public URL"
            className="p-xs text-highlight-10 hover:bg-neutral-30 rounded"
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    {
      key: "id",
      header: "",
      render: (_v, row) => (
        <button
          type="button"
          onClick={() => handleRevoke(row.id)}
          disabled={revokingId === row.id}
          aria-label={`Revoke share link for ${row.menu}`}
          className="gap-xs px-sm py-xs text-body text-status-danger hover:bg-neutral-30 inline-flex items-center rounded-lg disabled:opacity-50"
        >
          <Trash2 size={14} />
          {revokingId === row.id ? "Revoking…" : "Revoke"}
        </button>
      ),
    },
  ];

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Shareable links"
        description="Active public links to PDF reports. Revoke any link to invalidate the URL immediately."
      />

      {isLoading ? (
        <p className="text-body text-highlight-10">Loading shareable links…</p>
      ) : (
        <DataTable<ShareableLink>
          columns={columns}
          data={links}
          emptyIcon={Link2}
          emptyMessage="No active shareable links"
          emptyDescription="Use the Share button on any report to create a public link."
        />
      )}
    </div>
  );
}
