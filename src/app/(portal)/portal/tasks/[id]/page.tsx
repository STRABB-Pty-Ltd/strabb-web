"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePortalTask, useTransitionTask } from "@/lib/api-hooks/portal-api";
import { ApiError } from "@/lib/api-client";
import { formatPortalWhen } from "@/lib/portal-time";
import { nextActionForStatus, type TransitionAction } from "@/lib/schemas/portal";
import { useAppStore } from "@/stores/app-store";

import { PortalStatusChip } from "../../../_components/portal-status-chip";

const ACTION_LABELS: Record<TransitionAction, string> = {
  accept: "Accept clean",
  start: "Start clean",
  complete: "Mark complete",
};

const ACTION_SUCCESS: Record<TransitionAction, string> = {
  accept: "Clean accepted",
  start: "Clean started",
  complete: "Clean completed",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-body text-highlight-10 font-medium">{value}</span>
    </div>
  );
}

export default function PortalTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: task, isLoading, isError } = usePortalTask(id);
  const transition = useTransitionTask(id);
  const addToast = useAppStore((s) => s.addToast);

  const [actualHours, setActualHours] = useState("");
  const [note, setNote] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Pre-fill the actual-hours field from the estimate the first time a task in
  // progress is loaded, so completing is a one-tap default the cleaner can tweak.
  useEffect(() => {
    if (task && !seeded && task.status === "in_progress") {
      setActualHours(String(task.estimatedHours));
      setSeeded(true);
    }
  }, [task, seeded]);

  const action = task ? nextActionForStatus(task.status) : null;
  const hoursNum = Number(actualHours);
  const hoursValid = actualHours.trim() === "" || (!Number.isNaN(hoursNum) && hoursNum > 0);

  const handleAction = (act: TransitionAction) => {
    const payload =
      act === "complete"
        ? {
            action: act,
            actualHours: actualHours.trim() === "" ? undefined : hoursNum,
            notes: note.trim() === "" ? undefined : note.trim(),
          }
        : { action: act };
    transition.mutate(payload, {
      onSuccess: () => addToast({ type: "success", message: ACTION_SUCCESS[act] }),
      onError: (err) => {
        // A 409 means the clean moved on in another session; the hook has
        // already rolled the optimistic change back and refetched, so tell the
        // cleaner rather than showing a false success.
        const message =
          err instanceof ApiError && err.status === 409
            ? "This clean was already updated. Refreshing its status."
            : err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.";
        addToast({ type: "error", message });
      },
    });
  };

  return (
    <div className="space-y-md">
      <Link
        href="/portal"
        className="gap-xs text-body text-highlight-10 inline-flex items-center font-medium"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </Link>

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body text-highlight-10"
        >
          Loading...
        </p>
      )}

      {isError && !task && (
        <div className="p-md rounded-lg" style={{ backgroundColor: "var(--neutral-30)" }}>
          <p className="text-body text-highlight-10 font-semibold">Couldn&apos;t load this clean</p>
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            It may have been reassigned. Go back to your list and try again.
          </p>
        </div>
      )}

      {task && (
        <>
          <div className="space-y-xs">
            <div className="gap-sm flex items-center justify-between">
              <h1 className="text-subheading text-highlight-10 font-semibold">
                {task.listingName || "Cleaning task"}
              </h1>
              <PortalStatusChip status={task.status} />
            </div>
          </div>

          <div
            className="p-md space-y-sm rounded-lg"
            style={{ backgroundColor: "var(--neutral-30)" }}
          >
            <DetailRow label="Type" value={task.taskType.replace(/_/g, " ")} />
            <DetailRow label="Scheduled" value={formatPortalWhen(task.scheduledDate)} />
            <DetailRow label="Estimated hours" value={String(task.estimatedHours)} />
            {task.actualHours !== null && (
              <DetailRow label="Actual hours" value={String(task.actualHours)} />
            )}
            <DetailRow label="Checklist" value={`${task.checklistDone}/${task.checklistTotal}`} />
          </div>

          {task.notes && (
            <div
              className="p-md space-y-xs rounded-lg"
              style={{ backgroundColor: "var(--neutral-30)" }}
            >
              <p className="text-body font-semibold" style={{ color: "var(--text-secondary)" }}>
                Notes
              </p>
              <p className="text-body text-highlight-10 whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {action === "complete" && (
            <div className="space-y-sm">
              <label className="space-y-xs block">
                <span className="text-body text-highlight-10 font-medium">Actual hours</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                />
              </label>
              {!hoursValid && (
                <p className="text-body" style={{ color: "var(--status-danger)" }}>
                  Enter a positive number of hours.
                </p>
              )}
              <label className="space-y-xs block">
                <span className="text-body text-highlight-10 font-medium">Note (optional)</span>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </label>
            </div>
          )}

          {action && (
            <Button
              type="button"
              onClick={() => handleAction(action)}
              disabled={transition.isPending || (action === "complete" && !hoursValid)}
              className="min-h-[var(--touch-target-min)] w-full font-semibold"
            >
              {transition.isPending ? "Saving..." : ACTION_LABELS[action]}
            </Button>
          )}

          {!action && (task.status === "completed" || task.status === "cancelled") && (
            <p className="text-body text-center" style={{ color: "var(--text-secondary)" }}>
              {task.status === "completed"
                ? "This clean is complete."
                : "This clean was cancelled."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
