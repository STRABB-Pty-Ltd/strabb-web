"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Inbox,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
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
const VALID_TABS: Tab[] = ["pending", "sent", "failed", "logs"];

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  sent: "var(--status-completed)",
  failed: "var(--status-danger)",
  cancelled: "var(--status-cancelled)",
};

const statusFgColors: Record<string, string> = {
  pending: "var(--status-danger-fg)",
  sent: "var(--status-success-fg)",
  failed: "var(--status-danger-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  sent: CheckCircle,
  failed: AlertCircle,
  cancelled: XCircle,
};

export default function ScheduledMessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab = VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "pending";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [page, setPage] = useState(1);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
              className="px-sm py-base text-body -mb-px border-b-2 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{
                borderColor: active ? "var(--highlight-10)" : "transparent",
                color: active ? "var(--highlight-10)" : "var(--highlight-10)",
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
        <span className="text-body text-highlight-10 truncate">{m.recipientEmail}</span>
      ),
    },
    {
      key: "templateName",
      header: "Template",
      render: (_v, m) => <span className="text-body text-highlight-10">{m.templateName}</span>,
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
      render: (_v, m) => {
        const Icon = statusIcons[m.status];
        return (
          <span
            className="gap-xs px-base py-xs text-body inline-flex items-center rounded-md font-medium"
            style={{
              backgroundColor: statusColors[m.status] ?? "var(--highlight-10)",
              color: statusFgColors[m.status] ?? "var(--surface-60)",
            }}
          >
            {Icon && <Icon size={11} aria-hidden="true" />}
            {m.status}
          </span>
        );
      },
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
        <span className="text-body text-highlight-10 truncate">{m.errorMessage ?? ""}</span>
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
          className="gap-xs px-sm py-xs text-body text-highlight-10 hover:bg-neutral-30 inline-flex items-center rounded-lg border font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-60"
          style={{ borderColor: "var(--border)" }}
        >
          <RefreshCw size={12} aria-hidden="true" />
          Resend
        </button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-xs" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading messages</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  const messages = data?.data ?? [];
  const meta = data?.meta;

  const emptyCopy: Record<typeof status, { title: string; description?: string }> = {
    pending: {
      title: "No scheduled messages",
      description: "Queued messages will appear here once a template fires.",
    },
    sent: {
      title: "No sent messages yet",
      description: "Delivered messages will appear here once a send succeeds.",
    },
    failed: {
      title: "No failures - all good",
      description: "Failed deliveries will land here so you can retry them.",
    },
  };
  const empty = emptyCopy[status];

  return (
    <div className="space-y-sm">
      <DataTable<ScheduledMessageResponse>
        columns={columns}
        data={messages}
        emptyMessage={empty.title}
        emptyDescription={empty.description}
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
    return (
      <p role="status" aria-live="polite" aria-busy="true" className="text-body text-highlight-10">
        Loading logs…
      </p>
    );
  }

  const logs = data?.data ?? [];
  const meta = data?.meta;

  if (logs.length === 0) {
    return (
      <div className="rounded-md border">
        <EmptyState
          icon={Inbox}
          title="No log entries yet"
          description="Provider responses and lifecycle events for scheduled messages will land here."
        />
      </div>
    );
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
                className="px-sm py-base gap-sm text-body hover:bg-neutral-30 flex w-full items-center text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown size={14} className="shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
                )}
                <span className="text-highlight-10 font-medium" style={{ minWidth: 144 }}>
                  {log.event}
                </span>
                <span className="font-data text-highlight-10" style={{ minWidth: 144 }}>
                  {format(new Date(log.createdAt), "d MMM yyyy, HH:mm:ss")}
                </span>
                <span className="text-highlight-10 flex-1 truncate">{log.details ?? ""}</span>
              </button>
              {isOpen && (
                <div
                  className="px-sm pb-base space-y-xs"
                  style={{ paddingLeft: "var(--space-lg)" }}
                >
                  {log.details && (
                    <div>
                      <p className="text-body text-highlight-10 font-semibold">Details</p>
                      <pre className="text-body text-highlight-10 whitespace-pre-wrap">
                        {log.details}
                      </pre>
                    </div>
                  )}
                  {log.providerResponse && (
                    <div>
                      <p className="text-body text-highlight-10 font-semibold">Provider response</p>
                      <pre className="text-body text-highlight-10 whitespace-pre-wrap">
                        {log.providerResponse}
                      </pre>
                    </div>
                  )}
                  <p className="text-body text-highlight-10">
                    Message ID: {log.scheduledMessageId}
                  </p>
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
    <nav
      aria-label="Pagination"
      className="gap-base text-body text-highlight-10 flex items-center justify-end"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-sm py-xs rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-40"
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
        className="px-sm py-xs rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-40"
        style={{ borderColor: "var(--border)" }}
      >
        Next
      </button>
    </nav>
  );
}
