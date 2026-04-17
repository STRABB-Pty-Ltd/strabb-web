"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { useSavedReports } from "@/hooks/use-reporting";

export function SavedReportsDrawer() {
  const { savedReports, loadReport, saveCurrentReport, deleteReport } = useSavedReports();
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleSave = () => {
    if (!newName.trim()) return;
    saveCurrentReport(newName.trim());
    setNewName("");
    setShowInput(false);
  };

  return (
    <div className="rounded-lg border bg-white p-sm" style={{ borderColor: "var(--border)" }}>
      <div className="mb-sm flex items-center justify-between">
        <h3 className="text-body font-semibold text-gray-700">Saved Reports</h3>
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-xs text-body font-medium"
          style={{ color: "var(--strabb-secondary)" }}
        >
          <Plus size={12} />
          Save Current
        </button>
      </div>

      {showInput && (
        <div className="mb-sm flex gap-base">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Report name..."
            className="flex-1 rounded-sm border px-base py-xs text-body"
            style={{ borderColor: "var(--border)" }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-sm px-sm py-xs text-body text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setNewName("");
            }}
            className="rounded-sm px-sm py-xs text-body text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}

      {savedReports.length === 0 ? (
        <p className="py-sm text-center text-body text-gray-400">No saved reports yet</p>
      ) : (
        <div className="space-y-base">
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-sm px-sm py-base hover:bg-gray-50"
            >
              <div>
                <p className="text-body font-medium text-gray-700">{report.name}</p>
                <p className="text-body text-gray-400">{report.timeframe.replace("_", " ")}</p>
              </div>
              <div className="flex gap-xs">
                <button
                  type="button"
                  onClick={() => loadReport(report.id)}
                  className="rounded-sm px-base py-xs text-body font-medium"
                  style={{ color: "var(--strabb-secondary)" }}
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => deleteReport(report.id)}
                  className="rounded-sm p-xs text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
