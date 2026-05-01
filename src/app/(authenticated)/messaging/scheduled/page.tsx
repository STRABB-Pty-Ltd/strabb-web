"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";

import { type Column, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useMessageLogs, useResendMessage, useScheduledMessages } from "@/hooks/use-messages";
import { ApiError } from "@/lib/api-client";
import type { MessageLogResponse, ScheduledMessageResponse } from "@/lib/schemas/message";
import { useAppStore } from "@/stores/app-store";

type Tab = "pending" | "sent" | "failed" | "logs";

const tabs: { id: Tab; label: string }[] = [
  { id: "pending", label: "Scheduled" },
  { id: "sent", label: "Sent" },
  { id: "failed", label: "Failed" },
  { id: "logs", label: "Logs" },
];

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  sent: "var(--status-completed)",
  failed: "var(--status-danger)",
  cancelled: "var(--status-cancelled)",
};

export default function ScheduledMessagesPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Scheduled messages"
        description="View queued, sent, and failed guest messages - and the underlying event log."
      />

      <div className="gap-xs flex border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              aria-current={active ? "page" : undefined}
              className="px-sm py-base text-body -mb-px border-b-2 font-medium transition-colors"
              style={{
                borderColor: active ? "var(--strabb-secondary)" : "transparent",
                color: active ? "var(--strabb-secondary)" : "var(--neutral-50)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "logs" ? (
        <LogsTab page={page} setPage={setPage} />
      ) : (
        <ScheduledTab status={tab} page={page} setPage={setPage} />
      )}
    </div>
  );
}

function ScheduledTab({
  status,
  page,
  setPage,
}: {
  status: "pending" | "sent" | "failed";
  page: number;
  setPage: (p: number) => void;
}) {
  const addToast = useAppStore((s) => s.addToast);
  const resendMessage = useResendMessage();
  const { data, isLoading } = useScheduledMessages({ status, page, pageSize: PAGE_SIZE });

  const handleResend = (id: string) => {
    resendMessage.mutate(id, {
      onSuccess: (resp) => {
        addToast({
          type: resp.sent ? "success" : "warning",
          message: resp.sent ? "Message resent" : "Resend attempted but not delivered",
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to resend message";
        addToast({ type: "error", message });
      },
    });
  };

  const columns: Column<ScheduledMessageResponse>[] = [
    {
      key: "recipientEmail",
      header: "Recipient",
      render: (_v, m) => (
        <span className="text-body truncate text-gray-800">{m.recipientEmail}</span>
      ),
    },
    {
      key: "templateName",
      header: "Template",
      render: (_v, m) => <span className="text-body text-gray-600">{m.templateName}</span>,
    },
    {
      key: "scheduledFor",
      header: "Scheduled for",
      render: (_v, m) => (
        <span className="font-data text-body">
          {format(new Date(m.scheduledFor), "d MMM yyyy, HH:mm")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_v, m) => (
        <span
          className="px-base py-xs text-body rounded-full font-medium text-white"
          style={{ backgroundColor: statusColors[m.status] ?? "var(--brand-10)" }}
        >
          {m.status}
        </span>
      ),
    },
    {
      key: "retryCount",
      header: "Retries",
      render: (_v, m) => <span className="font-data text-body">{m.retryCount}</span>,
    },
    {
      key: "errorMessage",
      header: "Error",
      render: (_v, m) => (
        <span className="text-body truncate text-gray-500">{m.errorMessage ?? ""}</span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_v, m) => (
        <button
          type="button"
          onClick={() => handleResend(m.id)}
          disabled={resendMessage.isPending}
          className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-lg border font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          style={{ borderColor: "var(--border)" }}
        >
          <RefreshCw size={12} />
          Resend
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <p className="text-body text-gray-400">Loading messages…</p>;
  }

  const messages = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-sm">
      <DataTable<ScheduledMessageResponse>
        columns={columns}
        data={messages}
        emptyMessage="No messages in this view"
      />
      {meta && <Pagination meta={meta} page={page} onChange={setPage} />}
    </div>
  );
}

function LogsTab({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data, isLoading } = useMessageLogs(page, PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <p className="text-body text-gray-400">Loading logs…</p>;
  }

  const logs = data?.data ?? [];
  const meta = data?.meta;

  if (logs.length === 0) {
    return <p className="text-body text-gray-500">No log entries.</p>;
  }

  return (
    <div className="space-y-sm">
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
        {logs.map((log: MessageLogResponse) => {
          const isOpen = expanded.has(log.id);
          return (
            <div
              key={log.id}
              className="border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => toggleExpanded(log.id)}
                className="px-sm py-base gap-sm text-body flex w-full items-center text-left hover:bg-gray-50"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown size={14} className="shrink-0" />
                ) : (
                  <ChevronRight size={14} className="shrink-0" />
                )}
                <span className="font-medium text-gray-800" style={{ minWidth: 140 }}>
                  {log.event}
                </span>
                <span className="font-data text-gray-500" style={{ minWidth: 160 }}>
                  {format(new Date(log.createdAt), "d MMM yyyy, HH:mm:ss")}
                </span>
                <span className="flex-1 truncate text-gray-500">{log.details ?? ""}</span>
              </button>
              {isOpen && (
                <div className="px-sm pb-base space-y-xs" style={{ paddingLeft: 36 }}>
                  {log.details && (
                    <div>
                      <p className="text-body font-semibold text-gray-700">Details</p>
                      <pre className="text-body whitespace-pre-wrap text-gray-700">
                        {log.details}
                      </pre>
                    </div>
                  )}
                  {log.providerResponse && (
                    <div>
                      <p className="text-body font-semibold text-gray-700">Provider response</p>
                      <pre className="text-body whitespace-pre-wrap text-gray-700">
                        {log.providerResponse}
                      </pre>
                    </div>
                  )}
                  <p className="text-body text-gray-400">Message ID: {log.scheduledMessageId}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {meta && <Pagination meta={meta} page={page} onChange={setPage} />}
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
