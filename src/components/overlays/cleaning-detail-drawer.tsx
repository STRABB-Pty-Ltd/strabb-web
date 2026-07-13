"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarCheck, CheckCircle, Clock, Loader, XCircle, type LucideIcon } from "lucide-react";

import {
  CleanerPickerDialog,
  type CleanerAssignment,
} from "@/components/overlays/cleaner-picker-dialog";
import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { cleaningStatusColors as statusColors } from "@/lib/cleaning-status";
import { useTicket, useTicketsAPI, useUpdateTicketAPI } from "@/lib/api-hooks/tickets-api";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatEnumLabel } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { Ticket } from "@/types/ticket";

const statusFgColors: Record<string, string> = {
  pending: "var(--status-danger-fg)",
  confirmed: "var(--status-confirmed-fg)",
  in_progress: "var(--status-success-fg)",
  completed: "var(--status-success-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CalendarCheck,
  in_progress: Loader,
  completed: CheckCircle,
  cancelled: XCircle,
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

  const [cleanerDialogOpen, setCleanerDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
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
      setNotes(task.notes ?? "");
      setEditingNotes(false);
      setCleanerDialogOpen(false);
    }
  }, [task?.id, task]);

  const showError = toastError(addToast);

  const handleSaveCleaner = (next: CleanerAssignment) => {
    if (!task) return;
    // Real team cleaner: send only the FK and let the API denormalise the
    // name/email/phone from the user record. One-off cleaner: null the FK and
    // persist the free-text trio as entered.
    const data = next.assignedUserId
      ? { assignedUserId: next.assignedUserId }
      : {
          assignedUserId: null,
          cleanerName: next.cleanerName || null,
          cleanerEmail: next.cleanerEmail || null,
          cleanerPhone: next.cleanerPhone || null,
        };
    updateTask.mutate(
      {
        id: task.id,
        data,
      },
      {
        onSuccess: () => {
          setCleanerDialogOpen(false);
          addToast({ type: "success", message: "Cleaner updated" });
        },
        onError: showError,
      },
    );
  };

  const handleSaveNotes = () => {
    if (!task) return;
    updateTask.mutate(
      {
        id: task.id,
        data: { notes: notes || null },
      },
      {
        onSuccess: () => {
          setEditingNotes(false);
          addToast({ type: "success", message: "Notes saved" });
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
      accentColor={statusColors[status] ?? "var(--highlight-10)"}
    >
      {open && isLoading && <p className="text-body text-highlight-10">Loading task…</p>}
      {open && !isLoading && !task && (
        <p className="text-body text-highlight-10">Task not found.</p>
      )}
      {displayTask && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-highlight-10">{placeLabel}</p>
            <p className="text-body text-highlight-10 font-medium">{placeValue}</p>
          </div>

          <div>
            <p className="text-body text-highlight-10">Scheduled</p>
            <p className="text-body text-highlight-10 font-medium">
              {formatInPropertyTimezone(displayTask.scheduledDate, tz, "d MMM yyyy, HH:mm")}
            </p>
          </div>

          <div>
            <p className="text-body text-highlight-10">Status</p>
            {(() => {
              const Icon = statusIcons[status];
              return (
                <Chip
                  tone="solid"
                  size="sm"
                  radius="md"
                  color={statusColors[status] ?? "var(--highlight-10)"}
                  textColor={statusFgColors[status] ?? "var(--surface-60)"}
                >
                  {Icon && <Icon size={11} aria-hidden="true" />}
                  {status.replace("_", " ")}
                </Chip>
              );
            })()}
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <p
                id="cleaning-drawer-cleaner-heading"
                className="text-body text-highlight-10 font-semibold"
              >
                Cleaner
              </p>
              {!isCompleted && (
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  onClick={() => setCleanerDialogOpen(true)}
                >
                  {displayTask.cleanerName ? "Change" : "Assign"}
                </Button>
              )}
            </div>

            <div className="text-body space-y-xs">
              <p className="text-highlight-10">{displayTask.cleanerName || "Unassigned"}</p>
              {displayTask.cleanerEmail && (
                <p className="text-highlight-10">{displayTask.cleanerEmail}</p>
              )}
              {displayTask.cleanerPhone && (
                <p className="text-highlight-10">{displayTask.cleanerPhone}</p>
              )}
            </div>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <p
                id="cleaning-drawer-notes-label"
                className="text-body text-highlight-10 font-semibold"
              >
                Notes
              </p>
              {!editingNotes && !isCompleted && (
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {!editingNotes ? (
              <p className="text-body text-highlight-10 whitespace-pre-wrap">
                {displayTask.notes || <span className="text-highlight-10">None</span>}
              </p>
            ) : (
              <div className="space-y-xs">
                <Textarea
                  id="cleaning-drawer-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for this cleaning…"
                  rows={4}
                  aria-labelledby="cleaning-drawer-notes-label"
                />
                <div className="gap-xs flex">
                  <Button type="button" onClick={handleSaveNotes} disabled={updateTask.isPending}>
                    {updateTask.isPending ? "Saving…" : "Save notes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingNotes(false);
                      setNotes(displayTask.notes ?? "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-xs">
            <p
              id="cleaning-drawer-linked-ticket-label"
              className="text-body text-highlight-10 font-semibold"
            >
              Linked ticket
            </p>
            {displayTask.linkedTicketId && linkedTicket ? (
              <div className="space-y-xs">
                <p className="text-body text-highlight-10">{linkedTicket.description}</p>
                <p className="text-body text-highlight-10">
                  Status: {formatEnumLabel(linkedTicket.status)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={unlinkTicket.isPending}
                >
                  {unlinkTicket.isPending ? "Removing…" : "Unlink"}
                </Button>
              </div>
            ) : linkingMode ? (
              <div className="space-y-xs">
                <Select
                  id="cleaning-drawer-linked-ticket-select"
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  aria-labelledby="cleaning-drawer-linked-ticket-label"
                  placeholder="Choose a ticket…"
                  options={candidateTickets.map((t) => ({ value: t.id, label: t.description }))}
                />
                <div className="gap-xs flex">
                  <Button
                    type="button"
                    onClick={handleLink}
                    disabled={!selectedTicketId || linkTicket.isPending}
                  >
                    {linkTicket.isPending ? "Linking…" : "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLinkingMode(false);
                      setSelectedTicketId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {candidateTickets.length === 0 && (
                  <p className="text-body text-highlight-10">No open tickets for this listing.</p>
                )}
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setLinkingMode(true)}>
                Link to ticket
              </Button>
            )}
          </div>

          <div className="gap-xs flex flex-wrap">
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleted || completeTask.isPending}
              className="px-sm py-base text-body text-text-on-color rounded-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--status-success)" }}
            >
              {completeTask.isPending ? "Completing…" : "Mark complete"}
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || resendNotification.isPending}
              title={!canResend ? "Needs a cleaner email" : undefined}
            >
              {resendNotification.isPending ? "Sending…" : "Resend notification"}
            </Button>
          </div>
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
      {displayTask && (
        <CleanerPickerDialog
          open={cleanerDialogOpen}
          onOpenChange={setCleanerDialogOpen}
          initial={{
            assignedUserId: displayTask.assignedUserId ?? null,
            cleanerName: displayTask.cleanerName ?? "",
            cleanerEmail: displayTask.cleanerEmail ?? "",
            cleanerPhone: displayTask.cleanerPhone ?? "",
          }}
          onSave={handleSaveCleaner}
          saving={updateTask.isPending}
        />
      )}
    </DrillDownPanel>
  );
}
