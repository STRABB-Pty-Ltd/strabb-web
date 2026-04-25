"use client";

import { format } from "date-fns";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CloudOffIcon,
  MailXIcon,
  RefreshCw,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { type Column, DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useFailedMessages, useSyncErrors, useSystemHealth } from "@/hooks/use-admin";
import { useResendMessage } from "@/hooks/use-messages";
import { ApiError } from "@/lib/api-client";
import type { SyncLogResponse } from "@/lib/schemas/admin";
import type { ScheduledMessageResponse } from "@/lib/schemas/message";
import { useAppStore } from "@/stores/app-store";

function HealthCard({
  label,
  count,
  icon: Icon,
  href,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  href?: string;
}) {
  const hasIssue = count > 0;
  const content = (
    <div
      className={`p-sm rounded-xl border ${hasIssue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : "bg-card"}`}
    >
      <div className="gap-sm flex items-center">
        <Icon
          className={`size-md ${hasIssue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
        />
        <div>
          <p className="text-muted-foreground text-body">{label}</p>
          <p
            className={`text-subheading font-semibold ${hasIssue ? "text-red-700 dark:text-red-300" : ""}`}
          >
            {count}
          </p>
        </div>
      </div>
    </div>
  );

  if (href && hasIssue) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}

export default function AdminPage() {
  const { data, isLoading } = useSystemHealth();

  return (
    <div className="space-y-md">
      <PageHeader
        title="System Health"
        description="Monitor sync failures, email failures, and task issues."
      />

      {isLoading && (
        <div className="py-xl flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {data && (
        <>
          {!data.hasIssues && (
            <div className="gap-base p-sm flex items-center rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircleIcon className="size-md text-green-600 dark:text-green-400" />
              <p className="text-body font-medium text-green-800 dark:text-green-200">
                All systems healthy — no failures detected.
              </p>
            </div>
          )}

          <div className="gap-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <HealthCard
              label="Sync Errors"
              count={data.syncErrors}
              icon={CloudOffIcon}
              href="/sync/logs"
            />
            <HealthCard
              label="Listings Errored"
              count={data.listingsErrored}
              icon={AlertTriangleIcon}
              href="/listings"
            />
            <HealthCard
              label="Tasks Failed"
              count={data.tasksFailed}
              icon={SparklesIcon}
              href="/automations/cleaning?status=failed"
            />
            <HealthCard
              label="Messages Failed"
              count={data.messagesFailed}
              icon={MailXIcon}
              href="/messaging/scheduled"
            />
            <HealthCard
              label="Notification Failures"
              count={data.notificationFailures}
              icon={AlertTriangleIcon}
            />
          </div>
        </>
      )}

      <SyncErrorsSection />
      <FailedMessagesSection />
    </div>
  );
}

function SyncErrorsSection() {
  const { data, isLoading } = useSyncErrors();
  const errors = data?.data ?? [];

  const columns: Column<SyncLogResponse>[] = [
    {
      key: "listingId",
      header: "Listing",
      render: (_v, row) => (
        <span className="font-data text-body">{row.listingId.slice(0, 8)}…</span>
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      render: (_v, row) => (
        <span className="font-data text-body">
          {format(new Date(row.startedAt), "d MMM yyyy, HH:mm")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_v, row) => (
        <span className="text-body font-medium" style={{ color: "var(--status-danger)" }}>
          {row.status}
        </span>
      ),
    },
    {
      key: "bookingsCreated",
      header: "Bookings",
      render: (_v, row) => (
        <span className="font-data text-body">
          {row.bookingsCreated}+/{row.bookingsUpdated}~/{row.bookingsUnchanged}=
        </span>
      ),
    },
    {
      key: "errorMessage",
      header: "Error",
      render: (_v, row) => (
        <span className="text-body truncate text-gray-600">{row.errorMessage ?? "—"}</span>
      ),
    },
  ];

  return (
    <section className="space-y-sm">
      <h2 className="text-subheading font-semibold">Recent sync errors</h2>
      {isLoading ? (
        <p className="text-body text-gray-400">Loading…</p>
      ) : (
        <DataTable<SyncLogResponse>
          columns={columns}
          data={errors}
          emptyMessage="No recent sync errors."
        />
      )}
    </section>
  );
}

function FailedMessagesSection() {
  const { data, isLoading } = useFailedMessages();
  const messages = data?.data ?? [];
  const addToast = useAppStore((s) => s.addToast);
  const resendMessage = useResendMessage();

  const handleResend = (id: string) => {
    resendMessage.mutate(id, {
      onSuccess: (resp) =>
        addToast({
          type: resp.sent ? "success" : "warning",
          message: resp.sent ? "Message resent" : "Resend attempted but not delivered",
        }),
      onError: (err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to resend";
        addToast({ type: "error", message });
      },
    });
  };

  const columns: Column<ScheduledMessageResponse>[] = [
    {
      key: "recipientEmail",
      header: "Recipient",
      render: (_v, row) => <span className="text-body text-gray-800">{row.recipientEmail}</span>,
    },
    {
      key: "templateName",
      header: "Template",
      render: (_v, row) => <span className="text-body text-gray-600">{row.templateName}</span>,
    },
    {
      key: "scheduledFor",
      header: "Scheduled",
      render: (_v, row) => (
        <span className="font-data text-body">
          {format(new Date(row.scheduledFor), "d MMM yyyy, HH:mm")}
        </span>
      ),
    },
    {
      key: "retryCount",
      header: "Retries",
      render: (_v, row) => <span className="font-data text-body">{row.retryCount}</span>,
    },
    {
      key: "errorMessage",
      header: "Error",
      render: (_v, row) => (
        <span className="text-body truncate text-gray-600">{row.errorMessage ?? "—"}</span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_v, row) => (
        <button
          type="button"
          onClick={() => handleResend(row.id)}
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

  return (
    <section className="space-y-sm">
      <h2 className="text-subheading font-semibold">Failed messages</h2>
      {isLoading ? (
        <p className="text-body text-gray-400">Loading…</p>
      ) : (
        <DataTable<ScheduledMessageResponse>
          columns={columns}
          data={messages}
          emptyMessage="No failed messages."
        />
      )}
    </section>
  );
}
