"use client";

import { useEffect, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { useProperties } from "@/hooks/use-properties";
import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { ApiError } from "@/lib/api-client";
import { useDeleteTicketAPI, useTicket, useUpdateTicketAPI } from "@/lib/api-hooks/tickets-api";
import { formatInPropertyTimezone } from "@/lib/date-utils";
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
  completed: "var(--status-completed)",
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

  const open = drillDownPanel?.open && drillDownPanel.type === "ticket";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: ticket, isLoading } = useTicket(itemId);
  const tz = usePropertyTimezone(ticket?.propertyId);
  const { data: propertiesData } = useProperties();
  const updateTicket = useUpdateTicketAPI();
  const deleteTicket = useDeleteTicketAPI();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [status, setStatus] = useState<TicketStatus>("pending");
  const [dateScheduled, setDateScheduled] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (ticket) {
      setDescription(ticket.description);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setDateScheduled(toIsoLocalInput(ticket.dateScheduled));
      setCost(ticket.cost ?? "");
      setNotes(ticket.notes ?? "");
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [ticket?.id, ticket]);

  if (!open) return null;

  const propertyName = ticket
    ? ((propertiesData?.data ?? []).find((p) => p.id === ticket.propertyId)?.name ??
      ticket.propertyId.slice(0, 8))
    : "";

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
    updateTicket.mutate(
      {
        id: ticket.id,
        data: {
          description,
          priority,
          status,
          dateScheduled: dateScheduled ? new Date(dateScheduled).toISOString() : null,
          cost: cost || null,
          notes: notes || null,
        } as Partial<Ticket>,
      },
      {
        onSuccess: () => {
          setEditing(false);
          addToast({ type: "success", message: "Ticket updated" });
        },
        onError: surfaceError,
      },
    );
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
    setCost(ticket.cost ?? "");
    setNotes(ticket.notes ?? "");
    setEditing(false);
  };

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Ticket"
      accentColor={statusColors[ticket?.status ?? "pending"] ?? "var(--strabb-secondary)"}
    >
      {isLoading && <p className="text-body text-gray-400">Loading ticket…</p>}
      {!isLoading && !ticket && <p className="text-body text-gray-500">Ticket not found.</p>}
      {ticket && (
        <div className="space-y-md">
          <div>
            <p className="text-body text-gray-500">Property</p>
            <p className="text-body font-medium text-gray-800">{propertyName}</p>
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
                  className="px-base py-xs text-body inline-block rounded-full font-medium text-white"
                  style={{
                    backgroundColor: statusColors[status] ?? "var(--brand-10)",
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
              <p className="font-data text-body">{fmtDate(ticket.dateReported, tz)}</p>
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
                <p className="font-data text-body">{fmtDate(ticket.dateScheduled, tz)}</p>
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
              <p className="text-body whitespace-pre-wrap text-gray-800">{ticket.description}</p>
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
                <p className="font-data text-body">{ticket.cost ? `$${ticket.cost}` : "-"}</p>
              )}
            </div>
            <div>
              <p className="text-body text-gray-500">Completed</p>
              <p className="font-data text-body">{fmtDate(ticket.dateCompleted, tz)}</p>
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
                {ticket.notes || <span className="text-gray-400">None</span>}
              </p>
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
                    className="px-sm py-base text-body rounded-lg font-medium text-white"
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
                      className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
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
                  style={{ backgroundColor: "var(--strabb-secondary)" }}
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
    </DrillDownPanel>
  );
}
