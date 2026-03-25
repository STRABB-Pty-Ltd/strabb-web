"use client";

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CloudOffIcon,
  MailXIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useSystemHealth } from "@/hooks/use-admin";

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
      className={`rounded-xl border p-4 ${hasIssue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : "bg-card"}`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`size-5 ${hasIssue ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
        />
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p
            className={`text-xl font-semibold ${hasIssue ? "text-red-700 dark:text-red-300" : ""}`}
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
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor sync failures, email failures, and task issues."
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {data && (
        <>
          {!data.hasIssues && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <CheckCircleIcon className="size-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                All systems healthy — no failures detected.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
              href="/automations/messages"
            />
            <HealthCard
              label="Notification Failures"
              count={data.notificationFailures}
              icon={AlertTriangleIcon}
            />
          </div>
        </>
      )}
    </div>
  );
}
