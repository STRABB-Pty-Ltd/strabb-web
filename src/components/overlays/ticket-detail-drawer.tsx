"use client";

import { useEffect, useRef, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCompleteCleaningTask } from "@/hooks/use-cleaning-tasks";
import { useListings } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { ApiError } from "@/lib/api-client";
import { useCleaningTasksAPI } from "@/lib/api-hooks/cleaning-api";
import {
  useDeleteTicketAPI,
  useLinkCleanToTicket,
  useTicket,
  useUnlinkCleanFromTicket,
  useUpdateTicketAPI,
} from "@/lib/api-hooks/tickets-api";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format-currency";
import { useAppStore } from "@/stores/app-store";
import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/types/ticket";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

function fmtDate(iso: string | null, tz: string): string {
  if (!iso) return "-";
  return formatInPropertyTimezone(iso, tz, "d MMM yyyy, HH:mm");
}

function toIsoLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TicketDetailDrawer() {
  const drillDownPanel = useAppStore((s) => s.drillDownPanel);
  const closeDrillDownPanel = useAppStore((s) => s.closeDrillDownPanel);
  const addToast = useAppStore((s) => s.addToast);

  const open = !!drillDownPanel?.open && drillDownPanel.type === "ticket";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: ticket, isLoading } = useTicket(itemId);
  const tz = usePropertyTimezone(ticket?.propertyId);
  const { data: propertiesData } = useProperties();
  const { data: listingsData } = useListings();
  const updateTicket = useUpdateTicketAPI();
  const deleteTicket = useDeleteTicketAPI();
  const linkClean = useLinkCleanToTicket();
  const unlinkClean = useUnlinkCleanFromTicket();
  const completeClean = useCompleteCleaningTask();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [status, setStatus] = useState<TicketStatus>("pending");
  const [dateScheduled, setDateScheduled] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [linkingMode, setLinkingMode] = useState(false);
  const [selectedCleanId, setSelectedCleanId] = useState("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const { data: cleansForListing } = useCleaningTasksAPI(
    [],
    ticket?.listingId ? [ticket.listingId] : [],
  );
  const allCleans = cleansForListing ?? [];
  // Linked clean comes from the API via ticket.linkedCleanId; allCleans is
  // only here to populate the picker dropdown.
  const linkedClean = ticket?.linkedCleanId
    ? (allCleans.find((c) => c.id === ticket.linkedCleanId) ?? null)
    : null;
  const candidateCleans = allCleans.filter(
    (c) => c.status !== "completed" && c.status !== "cancelled" && !c.linkedTicketId,
  );

  useEffect(() => {
    if (ticket) {
      setDescription(ticket.description);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setDateScheduled(toIsoLocalInput(ticket.dateScheduled));
      setCost(ticket.cost == null ? "" : String(ticket.cost));
      setNotes(ticket.notes ?? "");
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [ticket?.id, ticket]);

  // Cache the last-seen ticket so the drawer body stays populated through
  // the 300ms close animation. Only fall back during close - while open we
  // trust the live `ticket` so loading states fire correctly on re-open.
  const lastTicketRef = useRef<typeof ticket | null>(null);
  if (ticket) lastTicketRef.current = ticket;
  const displayTicket = open ? ticket : lastTicketRef.current;

  const propertyName = displayTicket
    ? ((propertiesData?.data ?? []).find((p) => p.id === displayTicket.propertyId)?.name ??
      displayTicket.propertyId.slice(0, 8))
    : "";
  const listingName = displayTicket?.listingId
    ? ((listingsData?.data ?? []).find((l) => l.id === displayTicket.listingId)?.name ?? null)
    : null;
  const placeLabel = listingName ? "Listing" : "Property";
  const placeValue = listingName ?? propertyName;

  const surfaceError = (err: unknown) => {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    addToast({ type: "error", message });
  };

  const handleSave = () => {
    if (!ticket) return;
    const wasCompleted = ticket.status === "completed";
    updateTicket.mutate(
      {
        id: ticket.id,
        data: {
          description,
          priority,
          status,
          dateScheduled: dateScheduled ? new Date(dateScheduled).toISOString() : null,
          cost: cost ? parseFloat(cost) : null,
          notes: notes || null,
        } as Partial<Ticket>,
      },
      {
        onSuccess: () => {
          setEditing(false);
          addToast({ type: "success", message: "Ticket updated" });
          if (
            status === "completed"
            && !wasCompleted
            && linkedClean
            && linkedClean.status !== "completed"
          ) {
            setShowCompleteConfirm(true);
          }
        },
        onError: surfaceError,
      },
    );
  };

  const handleLinkClean = () => {
    if (!ticket || !selectedCleanId) return;
    linkClean.mutate(
      { ticketId: ticket.id, cleaningTaskId: selectedCleanId },
      {
        onSuccess: () => {
          addToast({ type: "success", message: "Clean linked to ticket" });
          setLinkingMode(false);
          setSelectedCleanId("");
        },
        onError: surfaceError,
      },
    );
  };

  const handleUnlinkClean = () => {
    if (!ticket) return;
    unlinkClean.mutate(ticket.id, {
      onSuccess: () => addToast({ type: "success", message: "Link removed" }),
      onError: surfaceError,
    });
  };

  const handleConfirmCloseLinkedClean = async () => {
    if (!linkedClean) return;
    await new Promise<void>((resolve, reject) => {
      completeClean.mutate(linkedClean.id, {
        onSuccess: () => {
          addToast({ type: "success", message: "Linked clean marked complete" });
          resolve();
        },
        onError: (err) => {
          surfaceError(err);
          reject(err);
        },
      });
    });
  };

  const handleDelete = () => {
    if (!ticket) return;
    deleteTicket.mutate(ticket.id, {
      onSuccess: () => {
        addToast({ type: "success", message: "Ticket deleted" });
        closeDrillDownPanel();
      },
      onError: surfaceError,
    });
  };

  const cancelEdit = () => {
    if (!ticket) return;
    setDescription(ticket.description);
    setPriority(ticket.priority);
    setStatus(ticket.status);
    setDateScheduled(toIsoLocalInput(ticket.dateScheduled));
    setCost(ticket.cost == null ? "" : String(ticket.cost));
    setNotes(ticket.notes ?? "");
    setEditing(false);
  };

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Ticket"
      accentColor={statusColors[status] ?? "var(--strabb-secondary)"}
    >
      {open && isLoading && <p className="text-body text-gray-400">Loading ticket…</p>}
      {open && !isLoading && !ticket && (
        <p className="text-body text-gray-500">Ticket not found.</p>
      )}
      {displayTicket && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-gray-500">{placeLabel}</p>
            <p className="text-body font-medium text-gray-800">{placeValue}</p>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">Priority</p>
              {editing ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  {TICKET_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-body font-medium text-gray-800">{priority}</p>
              )}
            </div>
            <div>
              <p className="text-body text-gray-500">Status</p>
              {editing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  {TICKET_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className="px-base py-xs text-body inline-block rounded-md font-medium"
                  style={{
                    backgroundColor: statusColors[status] ?? "var(--brand-10)",
                    color: "var(--surface-60)",
                  }}
                >
                  {status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">Reported</p>
              <p className="font-data text-body">{fmtDate(displayTicket.dateReported, tz)}</p>
            </div>
            <div>
              <p className="text-body text-gray-500">Scheduled</p>
              {editing ? (
                <input
                  type="datetime-local"
                  value={dateScheduled}
                  onChange={(e) => setDateScheduled(e.target.value)}
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
              ) : (
                <p className="font-data text-body">{fmtDate(displayTicket.dateScheduled, tz)}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-body text-gray-500">Description</p>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{ borderColor: "var(--border)" }}
              />
            ) : (
              <p className="text-body whitespace-pre-wrap text-gray-800">
                {displayTicket.description}
              </p>
            )}
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">Cost</p>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="px-sm py-base text-body w-full rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
              ) : (
                <p className="font-data text-body">
                  {displayTicket.cost != null
                    ? formatCurrency(displayTicket.cost, displayTicket.currency)
                    : "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-body text-gray-500">Completed</p>
              <p className="font-data text-body">{fmtDate(displayTicket.dateCompleted, tz)}</p>
            </div>
          </div>

          <div>
            <p className="text-body text-gray-500">Notes</p>
            {editing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{ borderColor: "var(--border)" }}
              />
            ) : (
              <p className="text-body whitespace-pre-wrap text-gray-800">
                {displayTicket.notes || <span className="text-gray-400">None</span>}
              </p>
            )}
          </div>

          <div className="space-y-xs">
            <p className="text-body font-semibold text-gray-700">Linked clean</p>
            {linkedClean ? (
              <div className="space-y-xs">
                <p className="text-body text-gray-800">
                  {formatInPropertyTimezone(linkedClean.scheduledTime, tz, "d MMM yyyy, HH:mm")}
                </p>
                <p className="text-body text-gray-500">Status: {linkedClean.status}</p>
                <button
                  type="button"
                  onClick={handleUnlinkClean}
                  disabled={unlinkClean.isPending}
                  className="px-sm py-base text-body rounded-lg border font-medium text-gray-700 disabled:opacity-60"
                  style={{ borderColor: "var(--border)" }}
                >
                  {unlinkClean.isPending ? "Removing…" : "Unlink"}
                </button>
              </div>
            ) : linkingMode ? (
              <div className="space-y-xs">
                <select
                  value={selectedCleanId}
                  onChange={(e) => setSelectedCleanId(e.target.value)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Choose a clean…</option>
                  {candidateCleans.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatInPropertyTimezone(c.scheduledTime, tz, "d MMM yyyy, HH:mm")} -{" "}
                      {c.cleanerName ?? "Unassigned"}
                    </option>
                  ))}
                </select>
                <div className="gap-xs flex">
                  <button
                    type="button"
                    onClick={handleLinkClean}
                    disabled={!selectedCleanId || linkClean.isPending}
                    className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                    style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
                  >
                    {linkClean.isPending ? "Linking…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMode(false);
                      setSelectedCleanId("");
                    }}
                    className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Cancel
                  </button>
                </div>
                {candidateCleans.length === 0 && (
                  <p className="text-body text-gray-500">
                    No open cleans for this listing.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLinkingMode(true)}
                className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                style={{ borderColor: "var(--border)" }}
              >
                Link to clean
              </button>
            )}
          </div>

          <div
            className="gap-xs pt-sm flex flex-wrap border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                  style={{ borderColor: "var(--border)" }}
                >
                  Edit
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-sm py-base text-body text-text-on-color rounded-lg font-medium"
                    style={{ backgroundColor: "var(--status-danger)" }}
                  >
                    Delete
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteTicket.isPending}
                      className="px-sm py-base text-body text-text-on-color rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ backgroundColor: "var(--status-danger)" }}
                    >
                      {deleteTicket.isPending ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateTicket.isPending}
                  className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
                >
                  {updateTicket.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-sm py-base text-body rounded-lg border font-medium text-gray-700"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        title="Mark linked clean complete too?"
        description="The linked clean is still open. Close it as well?"
        confirmLabel="Yes, mark complete"
        cancelLabel="Leave it open"
        onConfirm={handleConfirmCloseLinkedClean}
      />
    </DrillDownPanel>
  );
}
