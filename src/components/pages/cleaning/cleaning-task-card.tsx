"use client";

import { format } from "date-fns";
import { Clock, User } from "lucide-react";

import type { CleaningTask } from "@/types/cleaning-task";

const typeLabels: Record<string, string> = {
  checkout: "Checkout",
  checkin: "Check-in",
  deep_clean: "Deep Clean",
  mid_stay: "Mid-Stay",
  inspection: "Inspection",
  turnover: "Turnover",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "#FEE2E2", text: "#DC2626" },
  high: { bg: "#FEF3C7", text: "#92400E" },
  medium: { bg: "#DBEAFE", text: "#1E40AF" },
  low: { bg: "#F3F4F6", text: "#6B7280" },
};

interface CleaningTaskCardProps {
  task: CleaningTask;
  onClick: () => void;
}

export function CleaningTaskCard({ task, onClick }: CleaningTaskCardProps) {
  const priority = priorityColors[task.priority] ?? priorityColors.low;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: task.listingColor }}
          />
          <span className="truncate text-sm font-medium text-gray-800">{task.listingName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {task.priority}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            {typeLabels[task.type] ?? task.type}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={10} />
          <span>{format(new Date(task.scheduledTime), "d MMM, HH:mm")}</span>
        </div>

        {task.assigneeName && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User size={10} />
            <span>{task.assigneeName}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${task.checklistTotal > 0 ? (task.checklistDone / task.checklistTotal) * 100 : 0}%`,
                backgroundColor: "var(--semantic-success)",
              }}
            />
          </div>
          <span className="font-data text-xs text-gray-500">
            {task.checklistDone}/{task.checklistTotal}
          </span>
        </div>
      </div>
    </button>
  );
}
