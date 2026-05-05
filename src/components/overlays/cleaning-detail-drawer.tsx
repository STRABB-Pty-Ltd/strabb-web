"use client";

import { useEffect, useRef, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useCleaningTask,
  useCompleteCleaningTask,
  useResendNotification,
  useUpdateCleaningTask,
} from "@/hooks/use-cleaning-tasks";
import { useListings } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { ApiError } from "@/lib/api-client";
import { useLinkTicketToClean, useUnlinkTicketFromClean } from "@/lib/api-hooks/cleaning-api";
import { useTicket, useTicketsAPI, useUpdateTicketAPI } from "@/lib/api-hooks/tickets-api";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { useAppStore } from "@/stores/app-store";
import type { Ticket } from "@/types/ticket";

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

  const open = !!drillDownPanel?.open && drillDownPanel.type === "cleaning";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: task, isLoading } = useCleaningTask(itemId);
  const tz = usePropertyTimezone(task?.propertyId);
  const { data: listingsData } = useListings();
  const { data: propertiesData } = useProperties();

  const updateTask = useUpdateCleaningTask();
  const completeTask = useCompleteCleaningTask();
  const resendNotification = useResendNotification();
  const linkTicket = useLinkTicketToClean();
  const unlinkTicket = useUnlinkTicketFromClean();
  const updateTicket = useUpdateTicketAPI();

  const [editing, setEditing] = useState(false);
  const [cleanerName, setCleanerName] = useState("");
  const [cleanerEmail, setCleanerEmail] = useState("");
  const [cleanerPhone, setCleanerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [linkingMode, setLinkingMode] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const linkedTicketId = task?.linkedTicketId ?? null;
  const { data: linkedTicket } = useTicket(linkedTicketId);
  const ticketsResponse = useTicketsAPI(
    task?.listingId ? { listingId: task.listingId, pageSize: 50 } : undefined,
  );
  const candidateTickets: Ticket[] = (ticketsResponse.data?.data ?? []).filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  );

  useEffect(() => {
    if (task) {
      setCleanerName(task.cleanerName ?? "");
      setCleanerEmail(task.cleanerEmail ?? "");
      setCleanerPhone(task.cleanerPhone ?? "");
      setNotes(task.notes ?? "");
      setEditing(false);
    }
  }, [task?.id, task]);

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
      onSuccess: () => {
        addToast({ type: "success", message: "Task marked complete" });
        if (linkedTicketId && linkedTicket && linkedTicket.status !== "completed") {
          setShowCompleteConfirm(true);
        }
      },
      onError: showError,
    });
  };

  const handleLink = () => {
    if (!task || !selectedTicketId) return;
    linkTicket.mutate(
      { cleanId: task.id, ticketId: selectedTicketId },
      {
        onSuccess: () => {
          addToast({ type: "success", message: "Ticket linked to clean" });
          setLinkingMode(false);
          setSelectedTicketId("");
        },
        onError: showError,
      },
    );
  };

  const handleUnlink = () => {
    if (!task) return;
    unlinkTicket.mutate(task.id, {
      onSuccess: () => addToast({ type: "success", message: "Link removed" }),
      onError: showError,
    });
  };

  const handleConfirmCloseLinkedTicket = async () => {
    if (!linkedTicketId) return;
    await new Promise<void>((resolve, reject) => {
      updateTicket.mutate(
        { id: linkedTicketId, data: { status: "completed" } },
        {
          onSuccess: () => {
            addToast({ type: "success", message: "Linked ticket marked complete" });
            resolve();
          },
          onError: (err) => {
            showError(err);
            reject(err);
          },
        },
      );
    });
  };

  const handleResend = () => {
    if (!task) return;
    resendNotification.mutate(task.id, {
      onSuccess: () => addToast({ type: "success", message: "Notification resent" }),
      onError: showError,
    });
  };

  // Cache the last-seen task so the accent bar + body content stay visible
  // through the 300ms close animation. While the drawer is open we trust
  // `task` directly (so a fresh open can show its real loading state); only
  // during the closing slide do we fall back to the cached snapshot.
  const lastTaskRef = useRef<typeof task | null>(null);
  if (task) lastTaskRef.current = task;
  const displayTask = open ? task : lastTaskRef.current;
  const status = displayTask?.status ?? "pending";
  const isCompleted = status === "completed" || status === "cancelled";
  const canResend = !!task?.cleanerEmail && !isCompleted;
  const listingName = displayTask?.listingId
    ? ((listingsData?.data ?? []).find((l) => l.id === displayTask.listingId)?.name ?? null)
    : null;
  const propertyName = displayTask
    ? ((propertiesData?.data ?? []).find((p) => p.id === displayTask.propertyId)?.name ?? null)
    : null;
  const placeLabel = listingName ? "Listing" : "Property";
  const placeValue = listingName ?? propertyName ?? "-";

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Cleaning task"
      accentColor={statusColors[status] ?? "var(--strabb-secondary)"}
    >
      {open && isLoading && <p className="text-body text-gray-400">Loading task…</p>}
      {open && !isLoading && !task && <p className="text-body text-gray-500">Task not found.</p>}
      {displayTask && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-gray-500">{placeLabel}</p>
            <p className="text-body font-medium text-gray-800">{placeValue}</p>
          </div>

          <div>
            <p className="text-body text-gray-500">Scheduled</p>
            <p className="text-body font-medium text-gray-800">
              {formatInPropertyTimezone(displayTask.scheduledDate, tz, "d MMM yyyy, HH:mm")}
            </p>
          </div>

          <div>
            <p className="text-body text-gray-500">Status</p>
            <span
              className="px-base py-xs text-body inline-block rounded-md font-medium"
              style={{
                backgroundColor: statusColors[status] ?? "var(--brand-10)",
                color: "var(--surface-60)",
              }}
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
                <p className="text-gray-800">{displayTask.cleanerName || "Unassigned"}</p>
                {displayTask.cleanerEmail && (
                  <p className="text-gray-500">{displayTask.cleanerEmail}</p>
                )}
                {displayTask.cleanerPhone && (
                  <p className="text-gray-500">{displayTask.cleanerPhone}</p>
                )}
              </div>
            ) : (
              <div className="space-y-xs">
                <input
                  type="text"
                  value={cleanerName}
                  onChange={(e) => setCleanerName(e.target.value)}
                  autoComplete="name"
                  placeholder="Cleaner name"
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
                <input
                  type="email"
                  value={cleanerEmail}
                  onChange={(e) => setCleanerEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="cleaner@example.com"
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
                <input
                  type="tel"
                  value={cleanerPhone}
                  onChange={(e) => setCleanerPhone(e.target.value)}
                  autoComplete="tel"
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
                {displayTask.notes || <span className="text-gray-400">None</span>}
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

          <div className="space-y-xs">
            <p className="text-body font-semibold text-gray-700">Linked ticket</p>
            {displayTask.linkedTicketId && linkedTicket ? (
              <div className="space-y-xs">
                <p className="text-body text-gray-800">{linkedTicket.description}</p>
                <p className="text-body text-gray-500">Status: {linkedTicket.status}</p>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={unlinkTicket.isPending}
                  className="px-sm py-base text-body rounded-lg border font-medium text-gray-700 disabled:opacity-60"
                  style={{ borderColor: "var(--border)" }}
                >
                  {unlinkTicket.isPending ? "Removing…" : "Unlink"}
                </button>
              </div>
            ) : linkingMode ? (
              <div className="space-y-xs">
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Choose a ticket…</option>
                  {candidateTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.description}
                    </option>
                  ))}
                </select>
                <div className="gap-xs flex">
                  <button
                    type="button"
                    onClick={handleLink}
                    disabled={!selectedTicketId || linkTicket.isPending}
                    className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--strabb-secondary)",
                      color: "var(--surface-60)",
                    }}
                  >
                    {linkTicket.isPending ? "Linking…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMode(false);
                      setSelectedTicketId("");
                    }}
                    className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Cancel
                  </button>
                </div>
                {candidateTickets.length === 0 && (
                  <p className="text-body text-gray-500">No open tickets for this listing.</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLinkingMode(true)}
                className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                style={{ borderColor: "var(--border)" }}
              >
                Link to ticket
              </button>
            )}
          </div>

          {editing ? (
            <div className="gap-xs flex">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateTask.isPending}
                className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
              >
                {updateTask.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setCleanerName(displayTask.cleanerName ?? "");
                  setCleanerEmail(displayTask.cleanerEmail ?? "");
                  setCleanerPhone(displayTask.cleanerPhone ?? "");
                  setNotes(displayTask.notes ?? "");
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
                className="px-sm py-base text-body text-text-on-color rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
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
      <ConfirmDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        title="Mark linked ticket complete too?"
        description="The linked ticket is still open. Close it as well?"
        confirmLabel="Yes, mark complete"
        cancelLabel="Leave it open"
        onConfirm={handleConfirmCloseLinkedTicket}
      />
    </DrillDownPanel>
  );
}
