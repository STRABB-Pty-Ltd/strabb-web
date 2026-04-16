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
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Saved Reports</h3>
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--strabb-secondary)" }}
        >
          <Plus size={12} />
          Save Current
        </button>
      </div>

      {showInput && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Report name..."
            className="flex-1 rounded border px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded px-3 py-1 text-xs text-white"
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
            className="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}

      {savedReports.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">No saved reports yet</p>
      ) : (
        <div className="space-y-2">
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{report.name}</p>
                <p className="text-xs text-gray-400">{report.timeframe.replace("_", " ")}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => loadReport(report.id)}
                  className="rounded px-2 py-1 text-xs font-medium"
                  style={{ color: "var(--strabb-secondary)" }}
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => deleteReport(report.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
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
