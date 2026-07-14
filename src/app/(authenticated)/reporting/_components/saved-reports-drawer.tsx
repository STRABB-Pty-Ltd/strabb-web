"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useSavedReports } from "@/hooks/use-reporting";

export function SavedReportsDrawer() {
  const {
    savedReports,
    activeSavedReport,
    loadReport,
    saveCurrentReport,
    deleteReport,
    resetToDefaultView,
  } = useSavedReports();
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingDelete = pendingDeleteId
    ? (savedReports.find((r) => r.id === pendingDeleteId) ?? null)
    : null;

  const handleSave = () => {
    if (!newName.trim()) return;
    saveCurrentReport(newName.trim());
    setNewName("");
    setShowInput(false);
  };

  return (
    <div className="p-sm bg-surface-60 rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <div className="mb-sm flex items-center justify-between">
        <h3 className="text-body text-highlight-10 font-semibold">Saved Reports</h3>
        <div className="gap-xs flex items-center">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={resetToDefaultView}
            disabled={activeSavedReport === null}
          >
            Show default
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="xs"
            onClick={() => setShowInput(true)}
            className="px-0"
          >
            <Plus size={12} aria-hidden="true" />
            Save Current
          </Button>
        </div>
      </div>

      {showInput && (
        <div className="mb-sm gap-base flex">
          <label htmlFor="saved-report-name" className="sr-only">
            Report name
          </label>
          <Input
            id="saved-report-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Report name..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button type="button" size="xs" onClick={handleSave}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setShowInput(false);
              setNewName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {savedReports.length === 0 ? (
        <EmptyState
          compact
          icon={Bookmark}
          title="No saved reports yet"
          description="Save your current view to revisit it later."
        />
      ) : (
        <div className="space-y-base">
          {savedReports.map((report) => {
            // The row whose view is currently on the canvas gets the inverted
            // selected treatment, mirroring the listings selected-row pattern.
            const isActive = report.id === activeSavedReport;
            const rowColor = isActive ? "var(--surface-60)" : "var(--highlight-10)";
            return (
              <div
                key={report.id}
                aria-current={isActive ? "true" : undefined}
                className={`px-sm py-base flex items-center justify-between rounded-sm ${
                  isActive ? "" : "hover:bg-neutral-30"
                }`}
                style={
                  isActive
                    ? { backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }
                    : undefined
                }
              >
                <div>
                  <p className="text-body font-medium" style={{ color: rowColor }}>
                    {report.name}
                  </p>
                  <p className="text-body" style={{ color: rowColor }}>
                    {report.timeframe.replace("_", " ")}
                  </p>
                </div>
                <div className="gap-xs flex">
                  <Button
                    type="button"
                    variant="quiet"
                    size="xs"
                    onClick={() => loadReport(report.id)}
                    // Row colour inverts on the active row - keep it inline.
                    style={{ color: rowColor }}
                    data-no-elevate
                  >
                    Load
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon-xs"
                    onClick={() => setPendingDeleteId(report.id)}
                    aria-label="Delete saved report"
                    className="hover:text-status-danger"
                    style={{ color: rowColor }}
                    data-no-elevate
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title="Delete saved report"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete report"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) deleteReport(pendingDeleteId);
        }}
      />
    </div>
  );
}
