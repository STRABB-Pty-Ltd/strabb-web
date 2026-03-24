"use client";

import { CheckCircleIcon, EyeIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { CleaningTaskDialog } from "@/components/cleaning-tasks/cleaning-task-dialog";
import { useCleaningTasks, useCompleteCleaningTask } from "@/hooks/use-cleaning-tasks";
import { useProperties } from "@/hooks/use-properties";
import { formatDateInTimezone } from "@/lib/date-utils";
import { TASK_STATUS_OPTIONS, type CleaningTaskResponse } from "@/lib/schemas/cleaning-task";

export default function CleaningTasksPage() {
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<CleaningTaskResponse | null>(null);

  const { data: propertiesData } = useProperties();
  const { data, isLoading, error } = useCleaningTasks({
    propertyId: propertyFilter || undefined,
    status: statusFilter || undefined,
  });
  const completeTask = useCompleteCleaningTask();

  const propertyOptions = [
    { value: "", label: "All properties" },
    ...(propertiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const propertyNameMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.name]),
  );
  const propertyTimezoneMap = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p.timezone]),
  );

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 dark:text-yellow-400",
    scheduled: "text-blue-600 dark:text-blue-400",
    notified: "text-green-700 dark:text-green-400",
    completed: "text-muted-foreground",
    failed: "text-destructive",
    cancelled: "text-muted-foreground line-through",
  };

  const columns = [
    {
      key: "scheduledDate" as const,
      header: "Scheduled",
      render: (value: CleaningTaskResponse["scheduledDate"], row: CleaningTaskResponse) => {
        const tz = propertyTimezoneMap[row.propertyId] ?? "UTC";
        return formatDateInTimezone(value, tz);
      },
    },
    {
      key: "propertyId" as const,
      header: "Property",
      render: (value: CleaningTaskResponse["propertyId"]) => propertyNameMap[value] ?? "—",
    },
    {
      key: "cleanerName" as const,
      header: "Cleaner",
      render: (value: CleaningTaskResponse["cleanerName"]) => value ?? "Unassigned",
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: CleaningTaskResponse["status"]) => (
        <span className={statusColors[value] ?? ""}>{value}</span>
      ),
    },
    {
      key: "id" as const,
      header: "",
      render: (_: CleaningTaskResponse["id"], row: CleaningTaskResponse) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View task"
            onClick={() => setSelectedTask(row)}
          >
            <EyeIcon />
          </Button>
          {row.status !== "completed" && row.status !== "cancelled" && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Complete task"
              onClick={() => completeTask.mutate(row.id)}
              disabled={completeTask.isPending}
            >
              <CheckCircleIcon />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleaning Tasks"
        description="Automatically generated from confirmed bookings."
      />

      <div className="flex items-center gap-3">
        <Select
          options={propertyOptions}
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={[...TASK_STATUS_OPTIONS]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          emptyMessage="No cleaning tasks yet. Tasks are generated automatically when bookings sync."
        />
      )}

      {selectedTask && (
        <CleaningTaskDialog
          task={selectedTask}
          propertyTimezone={propertyTimezoneMap[selectedTask.propertyId] ?? "UTC"}
          propertyName={propertyNameMap[selectedTask.propertyId] ?? "Unknown"}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
