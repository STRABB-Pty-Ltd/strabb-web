"use client";

import { useEffect, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import {
  useCleaningTask,
  useCompleteCleaningTask,
  useResendNotification,
  useUpdateCleaningTask,
} from "@/hooks/use-cleaning-tasks";
import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { ApiError } from "@/lib/api-client";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { useAppStore } from "@/stores/app-store";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

function toastError(addToast: ReturnType<typeof useAppStore.getState>["addToast"]) {
  return (err: unknown) => {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    addToast({ type: "error", message });
  };
}

export function CleaningDetailDrawer() {
  const drillDownPanel = useAppStore((s) => s.drillDownPanel);
  const closeDrillDownPanel = useAppStore((s) => s.closeDrillDownPanel);
  const addToast = useAppStore((s) => s.addToast);

  const open = drillDownPanel?.open && drillDownPanel.type === "cleaning";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: task, isLoading } = useCleaningTask(itemId);
  const tz = usePropertyTimezone(task?.propertyId);

  const updateTask = useUpdateCleaningTask();
  const completeTask = useCompleteCleaningTask();
  const resendNotification = useResendNotification();

  const [editing, setEditing] = useState(false);
  const [cleanerName, setCleanerName] = useState("");
  const [cleanerEmail, setCleanerEmail] = useState("");
  const [cleanerPhone, setCleanerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (task) {
      setCleanerName(task.cleanerName ?? "");
      setCleanerEmail(task.cleanerEmail ?? "");
      setCleanerPhone(task.cleanerPhone ?? "");
      setNotes(task.notes ?? "");
      setEditing(false);
    }
  }, [task?.id, task]);

  if (!open) return null;

  const showError = toastError(addToast);

  const handleSave = () => {
    if (!task) return;
    updateTask.mutate(
      {
        id: task.id,
        data: {
          cleanerName: cleanerName || null,
          cleanerEmail: cleanerEmail || null,
          cleanerPhone: cleanerPhone || null,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => {
          setEditing(false);
          addToast({ type: "success", message: "Task updated" });
        },
        onError: showError,
      },
    );
  };

  const handleComplete = () => {
    if (!task) return;
    completeTask.mutate(task.id, {
      onSuccess: () => addToast({ type: "success", message: "Task marked complete" }),
      onError: showError,
    });
  };

  const handleResend = () => {
    if (!task) return;
    resendNotification.mutate(task.id, {
      onSuccess: () => addToast({ type: "success", message: "Notification resent" }),
      onError: showError,
    });
  };

  const status = task?.status ?? "pending";
  const isCompleted = status === "completed" || status === "cancelled";
  const canResend = !!task?.cleanerEmail && !isCompleted;

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Cleaning task"
      accentColor={statusColors[status] ?? "var(--strabb-secondary)"}
    >
      {isLoading && <p className="text-body text-gray-400">Loading task…</p>}
      {!isLoading && !task && <p className="text-body text-gray-500">Task not found.</p>}
      {task && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-gray-500">Scheduled</p>
            <p className="text-body font-medium text-gray-800">
              {formatInPropertyTimezone(task.scheduledDate, tz, "d MMM yyyy, HH:mm")}
            </p>
          </div>

          <div>
            <p className="text-body text-gray-500">Status</p>
            <span
              className="px-base py-xs text-body inline-block rounded-full font-medium text-white dark:text-[var(--brand-10)]"
              style={{ backgroundColor: statusColors[status] ?? "var(--brand-10)" }}
            >
              {status.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <p className="text-body font-semibold text-gray-700">Cleaner</p>
              {!editing && !isCompleted && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-body font-medium text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div className="text-body space-y-xs">
                <p className="text-gray-800">{task.cleanerName || "Unassigned"}</p>
                {task.cleanerEmail && <p className="text-gray-500">{task.cleanerEmail}</p>}
                {task.cleanerPhone && <p className="text-gray-500">{task.cleanerPhone}</p>}
              </div>
            ) : (
              <div className="space-y-xs">
                <input
                  type="text"
                  value={cleanerName}
                  onChange={(e) => setCleanerName(e.target.value)}
                  placeholder="Cleaner name"
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
                <input
                  type="email"
                  value={cleanerEmail}
                  onChange={(e) => setCleanerEmail(e.target.value)}
                  placeholder="cleaner@example.com"
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
                <input
                  type="tel"
                  value={cleanerPhone}
                  onChange={(e) => setCleanerPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            )}
          </div>

          <div className="space-y-xs">
            <p className="text-body font-semibold text-gray-700">Notes</p>
            {!editing ? (
              <p className="text-body whitespace-pre-wrap text-gray-800">
                {task.notes || <span className="text-gray-400">None</span>}
              </p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions for this cleaning…"
                rows={4}
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{ borderColor: "var(--border)" }}
              />
            )}
          </div>

          {editing ? (
            <div className="gap-xs flex">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateTask.isPending}
                className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--strabb-secondary)" }}
              >
                {updateTask.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setCleanerName(task.cleanerName ?? "");
                  setCleanerEmail(task.cleanerEmail ?? "");
                  setCleanerPhone(task.cleanerPhone ?? "");
                  setNotes(task.notes ?? "");
                }}
                className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="gap-xs flex flex-wrap">
              <button
                type="button"
                onClick={handleComplete}
                disabled={isCompleted || completeTask.isPending}
                className="px-sm py-base text-body rounded-lg font-medium text-white dark:text-[var(--brand-10)] disabled:opacity-60"
                style={{ backgroundColor: "var(--semantic-success)" }}
              >
                {completeTask.isPending ? "Completing…" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resendNotification.isPending}
                className="px-sm py-base text-body rounded-lg border font-medium text-gray-700 disabled:opacity-60"
                style={{ borderColor: "var(--border)" }}
                title={!canResend ? "Needs a cleaner email" : undefined}
              >
                {resendNotification.isPending ? "Sending…" : "Resend notification"}
              </button>
            </div>
          )}
        </div>
      )}
    </DrillDownPanel>
  );
}
