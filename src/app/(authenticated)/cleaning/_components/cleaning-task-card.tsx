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
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

interface CleaningTaskCardProps {
  task: CleaningTask;
  onClick: () => void;
}

export function CleaningTaskCard({ task, onClick }: CleaningTaskCardProps) {
  const priority = priorityColors[task.priority] ?? priorityColors.low;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div className="space-y-xs">
        <div className="gap-base flex items-center">
          <span
            className="h-base w-base shrink-0 rounded-full"
            style={{ backgroundColor: task.listingColor }}
          />
          <span className="text-body truncate font-medium text-gray-800">{task.listingName}</span>
        </div>

        <div className="gap-base flex items-center">
          <span
            className="px-xs py-xs text-body rounded-sm font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {task.priority}
          </span>
          <span className="px-xs py-xs text-body rounded-sm bg-gray-100 font-medium text-gray-600">
            {typeLabels[task.type] ?? task.type}
          </span>
        </div>

        <div className="gap-xs text-body flex items-center text-gray-500">
          <Clock size={10} />
          <span>{format(new Date(task.scheduledTime), "d MMM, HH:mm")}</span>
        </div>

        {task.assigneeName && (
          <div className="gap-xs text-body flex items-center text-gray-500">
            <User size={10} />
            <span>{task.assigneeName}</span>
          </div>
        )}

        <div className="gap-base flex items-center">
          <div className="h-xs flex-1 rounded-full bg-gray-200">
            <div
              className="h-xs rounded-full"
              style={{
                width: `${task.checklistTotal > 0 ? (task.checklistDone / task.checklistTotal) * 100 : 0}%`,
                backgroundColor: "var(--semantic-success)",
              }}
            />
          </div>
          <span className="font-data text-body text-gray-500">
            {task.checklistDone}/{task.checklistTotal}
          </span>
        </div>
      </div>
    </button>
  );
}
