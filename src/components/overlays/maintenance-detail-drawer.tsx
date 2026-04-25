"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { useProperties } from "@/hooks/use-properties";
import { ApiError } from "@/lib/api-client";
import {
  useDeleteMaintenanceAPI,
  useMaintenance,
  useUpdateMaintenanceAPI,
} from "@/lib/api-hooks/maintenance-api";
import { useAppStore } from "@/stores/app-store";
import {
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  type Maintenance,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "@/types/maintenance";

const statusColors: Record<string, string> = {
  reported: "var(--status-pending)",
  scheduled: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy, HH:mm");
}

function toIsoLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function MaintenanceDetailDrawer() {
  const drillDownPanel = useAppStore((s) => s.drillDownPanel);
  const closeDrillDownPanel = useAppStore((s) => s.closeDrillDownPanel);
  const addToast = useAppStore((s) => s.addToast);

  const open = drillDownPanel?.open && drillDownPanel.type === "maintenance";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: maintenance, isLoading } = useMaintenance(itemId);
  const { data: propertiesData } = useProperties();
  const updateMaintenance = useUpdateMaintenanceAPI();
  const deleteMaintenance = useDeleteMaintenanceAPI();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("medium");
  const [status, setStatus] = useState<MaintenanceStatus>("reported");
  const [dateScheduled, setDateScheduled] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (maintenance) {
      setDescription(maintenance.description);
      setPriority(maintenance.priority);
      setStatus(maintenance.status);
      setDateScheduled(toIsoLocalInput(maintenance.dateScheduled));
      setCost(maintenance.cost ?? "");
      setNotes(maintenance.notes ?? "");
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [maintenance?.id, maintenance]);

  if (!open) return null;

  const propertyName = maintenance
    ? ((propertiesData?.data ?? []).find((p) => p.id === maintenance.propertyId)?.name ??
      maintenance.propertyId.slice(0, 8))
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
    if (!maintenance) return;
    updateMaintenance.mutate(
      {
        id: maintenance.id,
        data: {
          description,
          priority,
          status,
          dateScheduled: dateScheduled ? new Date(dateScheduled).toISOString() : null,
          cost: cost || null,
          notes: notes || null,
        } as Partial<Maintenance>,
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
    if (!maintenance) return;
    deleteMaintenance.mutate(maintenance.id, {
      onSuccess: () => {
        addToast({ type: "success", message: "Ticket deleted" });
        closeDrillDownPanel();
      },
      onError: surfaceError,
    });
  };

  const cancelEdit = () => {
    if (!maintenance) return;
    setDescription(maintenance.description);
    setPriority(maintenance.priority);
    setStatus(maintenance.status);
    setDateScheduled(toIsoLocalInput(maintenance.dateScheduled));
    setCost(maintenance.cost ?? "");
    setNotes(maintenance.notes ?? "");
    setEditing(false);
  };

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Ticket"
      accentColor={statusColors[maintenance?.status ?? "reported"] ?? "var(--strabb-secondary)"}
    >
      {isLoading && <p className="text-body text-gray-400">Loading ticket…</p>}
      {!isLoading && !maintenance && <p className="text-body text-gray-500">Ticket not found.</p>}
      {maintenance && (
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
                  onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  {MAINTENANCE_PRIORITY_OPTIONS.map((o) => (
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
                  onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                  className="px-sm py-base text-body w-full rounded-lg border bg-white"
                  style={{ borderColor: "var(--border)" }}
                >
                  {MAINTENANCE_STATUS_OPTIONS.map((o) => (
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
              <p className="font-data text-body">{fmtDate(maintenance.dateReported)}</p>
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
                <p className="font-data text-body">{fmtDate(maintenance.dateScheduled)}</p>
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
                {maintenance.description}
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
                  {maintenance.cost ? `$${maintenance.cost}` : "—"}
                </p>
              )}
            </div>
            <div>
              <p className="text-body text-gray-500">Completed</p>
              <p className="font-data text-body">{fmtDate(maintenance.dateCompleted)}</p>
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
                {maintenance.notes || <span className="text-gray-400">None</span>}
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
                      disabled={deleteMaintenance.isPending}
                      className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                      style={{ backgroundColor: "var(--status-danger)" }}
                    >
                      {deleteMaintenance.isPending ? "Deleting…" : "Yes, delete"}
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
                  disabled={updateMaintenance.isPending}
                  className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--strabb-secondary)" }}
                >
                  {updateMaintenance.isPending ? "Saving…" : "Save"}
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
