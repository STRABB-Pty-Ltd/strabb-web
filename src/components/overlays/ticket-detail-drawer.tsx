"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarCheck, CheckCircle, Clock, Loader, XCircle, type LucideIcon } from "lucide-react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { formatEnumLabel } from "@/lib/utils";
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

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CalendarCheck,
  in_progress: Loader,
  completed: CheckCircle,
  cancelled: XCircle,
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

function EditableChip({ onEdit, children }: { onEdit: () => void; children: ReactNode }) {
  return (
    <div
      className="px-base py-xs mt-xs gap-base flex items-center justify-between rounded-md"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      {children}
      <Button
        type="button"
        variant="quiet"
        size="xs"
        onClick={onEdit}
        className="shrink-0 underline-offset-2 hover:underline"
        style={{ color: "var(--text-secondary)" }}
      >
        edit
      </Button>
    </div>
  );
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

  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
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
      setEditFields({});
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
          setEditFields({});
          addToast({ type: "success", message: "Ticket updated" });
          if (
            status === "completed" &&
            !wasCompleted &&
            linkedClean &&
            linkedClean.status !== "completed"
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
    setEditFields({});
  };

  const anyEditing = Object.values(editFields).some(Boolean);
  const startEdit = (field: string) => setEditFields((s) => ({ ...s, [field]: true }));
  const editAll = () =>
    setEditFields({
      priority: true,
      status: true,
      scheduled: true,
      cost: true,
      description: true,
      notes: true,
    });

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Ticket"
      accentColor={statusColors[status] ?? "var(--highlight-10)"}
    >
      {open && isLoading && <p className="text-body text-highlight-10">Loading ticket…</p>}
      {open && !isLoading && !ticket && (
        <p className="text-body text-highlight-10">Ticket not found.</p>
      )}
      {displayTicket && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-highlight-10">{placeLabel}</p>
            <p className="text-body text-highlight-10 font-medium">{placeValue}</p>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <label htmlFor="ticket-drawer-priority" className="text-body text-highlight-10 block">
                Priority
              </label>
              {editFields.priority ? (
                <Select
                  id="ticket-drawer-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="mt-xs"
                  options={TICKET_PRIORITY_OPTIONS}
                />
              ) : (
                <EditableChip onEdit={() => startEdit("priority")}>
                  <span className="text-body text-highlight-10 font-medium">
                    {formatEnumLabel(priority)}
                  </span>
                </EditableChip>
              )}
            </div>
            <div>
              <label htmlFor="ticket-drawer-status" className="text-body text-highlight-10 block">
                Status
              </label>
              {editFields.status ? (
                <Select
                  id="ticket-drawer-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="mt-xs"
                  options={TICKET_STATUS_OPTIONS}
                />
              ) : (
                <EditableChip onEdit={() => startEdit("status")}>
                  {(() => {
                    const Icon = statusIcons[status];
                    return (
                      <span
                        className="gap-xs text-body inline-flex items-center font-medium"
                        style={{ color: statusColors[status] ?? "var(--highlight-10)" }}
                      >
                        {Icon && <Icon size={11} aria-hidden="true" />}
                        {formatEnumLabel(status)}
                      </span>
                    );
                  })()}
                </EditableChip>
              )}
            </div>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-highlight-10">Reported</p>
              <p className="font-data text-body">{fmtDate(displayTicket.dateReported, tz)}</p>
            </div>
            <div>
              <label
                htmlFor="ticket-drawer-date-scheduled"
                className="text-body text-highlight-10 block"
              >
                Scheduled
              </label>
              {editFields.scheduled ? (
                <DateTimePicker
                  id="ticket-drawer-date-scheduled"
                  value={dateScheduled}
                  onChange={setDateScheduled}
                  placeholder="Pick date and time"
                  background="var(--neutral-30)"
                />
              ) : (
                <EditableChip onEdit={() => startEdit("scheduled")}>
                  <span className="font-data text-body">
                    {fmtDate(displayTicket.dateScheduled, tz)}
                  </span>
                </EditableChip>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="ticket-drawer-description"
              className="text-body text-highlight-10 block"
            >
              Description
            </label>
            {editFields.description ? (
              <Textarea
                id="ticket-drawer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-body text-highlight-10 whitespace-pre-wrap">
                {displayTicket.description}
              </p>
            )}
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <label htmlFor="ticket-drawer-cost" className="text-body text-highlight-10 block">
                Cost
              </label>
              {editFields.cost ? (
                <Input
                  id="ticket-drawer-cost"
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="mt-xs"
                />
              ) : (
                <EditableChip onEdit={() => startEdit("cost")}>
                  <span className="font-data text-body">
                    {displayTicket.cost != null
                      ? formatCurrency(displayTicket.cost, displayTicket.currency)
                      : "-"}
                  </span>
                </EditableChip>
              )}
            </div>
            <div>
              <p className="text-body text-highlight-10">Completed</p>
              <p className="font-data text-body">{fmtDate(displayTicket.dateCompleted, tz)}</p>
            </div>
          </div>

          <div>
            <label htmlFor="ticket-drawer-notes" className="text-body text-highlight-10 block">
              Notes
            </label>
            {editFields.notes ? (
              <Textarea
                id="ticket-drawer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            ) : (
              <p className="text-body text-highlight-10 whitespace-pre-wrap">
                {displayTicket.notes || <span className="text-highlight-10">None</span>}
              </p>
            )}
          </div>

          <div className="space-y-xs">
            <p
              id="ticket-drawer-linked-clean-label"
              className="text-body text-highlight-10 font-semibold"
            >
              Linked clean
            </p>
            {linkedClean ? (
              <div className="space-y-xs">
                <p className="text-body text-highlight-10">
                  {formatInPropertyTimezone(linkedClean.scheduledTime, tz, "d MMM yyyy, HH:mm")}
                </p>
                <p className="text-body text-highlight-10">
                  Status: {formatEnumLabel(linkedClean.status)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUnlinkClean}
                  disabled={unlinkClean.isPending}
                >
                  {unlinkClean.isPending ? "Removing…" : "Unlink"}
                </Button>
              </div>
            ) : linkingMode ? (
              <div className="space-y-xs">
                <Select
                  id="ticket-drawer-linked-clean-select"
                  value={selectedCleanId}
                  onChange={(e) => setSelectedCleanId(e.target.value)}
                  aria-labelledby="ticket-drawer-linked-clean-label"
                  placeholder="Choose a clean…"
                  options={candidateCleans.map((c) => ({
                    value: c.id,
                    label: `${formatInPropertyTimezone(c.scheduledTime, tz, "d MMM yyyy, HH:mm")} - ${c.cleanerName ?? "Unassigned"}`,
                  }))}
                />
                <div className="gap-xs flex">
                  <Button
                    type="button"
                    onClick={handleLinkClean}
                    disabled={!selectedCleanId || linkClean.isPending}
                  >
                    {linkClean.isPending ? "Linking…" : "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLinkingMode(false);
                      setSelectedCleanId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {candidateCleans.length === 0 && (
                  <p className="text-body text-highlight-10">No open cleans for this listing.</p>
                )}
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setLinkingMode(true)}>
                Link to clean
              </Button>
            )}
          </div>

          <div
            className="gap-xs pt-sm flex flex-wrap border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {!anyEditing ? (
              <>
                <Button type="button" variant="outline" onClick={editAll}>
                  Edit
                </Button>
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive-solid"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="destructive-solid"
                      onClick={handleDelete}
                      disabled={deleteTicket.isPending}
                    >
                      {deleteTicket.isPending ? "Deleting…" : "Yes, delete"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button type="button" onClick={handleSave} disabled={updateTicket.isPending}>
                  {updateTicket.isPending ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
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
