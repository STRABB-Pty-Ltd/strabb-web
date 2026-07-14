"use client";

import { Clock, User } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { useTimezoneForListing } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatEnumLabel } from "@/lib/utils";
import type { CleaningTask } from "@/types/cleaning-task";

const typeLabels: Record<string, string> = {
  turnover: "Turnover",
  deep_clean: "Deep Clean",
  ad_hoc: "Ad Hoc",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
};

interface CleaningTaskCardProps {
  task: CleaningTask;
  onClick: () => void;
}

export function CleaningTaskCard({ task, onClick }: CleaningTaskCardProps) {
  const tz = useTimezoneForListing(task.listingId);
  const priority = priorityColors[task.priority] ?? priorityColors.low;

  return (
    <button type="button" onClick={onClick} className="w-full text-left" data-no-elevate>
      <div className="space-y-xs">
        <div className="gap-base flex items-center">
          <span className="text-body text-highlight-10 truncate font-medium">
            {task.listingName}
          </span>
        </div>

        <div className="gap-base flex items-center">
          <Chip tone="solid" size="xs" radius="sm" color={priority.bg} textColor={priority.text}>
            {formatEnumLabel(task.priority)}
          </Chip>
          <Chip size="xs" radius="sm">
            {typeLabels[task.type] ?? task.type}
          </Chip>
        </div>

        <div className="gap-xs text-body text-highlight-10 flex items-center">
          <Clock size={10} aria-hidden="true" />
          <span>{formatInPropertyTimezone(task.scheduledTime, tz, "d MMM, HH:mm")}</span>
        </div>

        {task.cleanerName && (
          <div className="gap-xs text-body text-highlight-10 flex items-center">
            <User size={10} aria-hidden="true" />
            <span>{task.cleanerName}</span>
          </div>
        )}

        <div className="gap-base flex items-center">
          <div className="h-xs bg-neutral-30 flex-1 rounded-full">
            <div
              className="h-xs rounded-full"
              style={{
                width: `${task.checklistTotal > 0 ? (task.checklistDone / task.checklistTotal) * 100 : 0}%`,
                backgroundColor: "var(--status-success)",
              }}
            />
          </div>
          <span className="font-data text-body text-highlight-10">
            {task.checklistDone}/{task.checklistTotal}
          </span>
        </div>
      </div>
    </button>
  );
}
