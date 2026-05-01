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
    <div className="p-sm rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
      <div className="mb-sm flex items-center justify-between">
        <h3 className="text-body font-semibold text-gray-700">Saved Reports</h3>
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="gap-xs text-body flex items-center font-medium"
          style={{ color: "var(--strabb-secondary)" }}
        >
          <Plus size={12} />
          Save Current
        </button>
      </div>

      {showInput && (
        <div className="mb-sm gap-base flex">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Report name..."
            className="px-base py-xs text-body flex-1 rounded-sm border"
            style={{ borderColor: "var(--border)" }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-sm py-xs text-body rounded-sm text-white"
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
            className="px-sm py-xs text-body rounded-sm text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}

      {savedReports.length === 0 ? (
        <p className="py-sm text-body text-center text-gray-400">No saved reports yet</p>
      ) : (
        <div className="space-y-base">
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="px-sm py-base flex items-center justify-between rounded-sm hover:bg-gray-50"
            >
              <div>
                <p className="text-body font-medium text-gray-700">{report.name}</p>
                <p className="text-body text-gray-400">{report.timeframe.replace("_", " ")}</p>
              </div>
              <div className="gap-xs flex">
                <button
                  type="button"
                  onClick={() => loadReport(report.id)}
                  className="px-base py-xs text-body rounded-sm font-medium"
                  style={{ color: "var(--strabb-secondary)" }}
                  data-no-elevate
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => deleteReport(report.id)}
                  aria-label="Delete saved report"
                  className="p-xs rounded-sm text-gray-400 hover:text-red-500"
                  data-no-elevate
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
