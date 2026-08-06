"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { usePortalTasks } from "@/lib/api-hooks/portal-api";
import { formatPortalWhen } from "@/lib/portal-time";
import type { PortalTask } from "@/lib/schemas/portal";

import { PortalStatusChip } from "../_components/portal-status-chip";

const TASK_TYPE_LABELS: Record<string, string> = {
  turnover: "Turnover",
  deep_clean: "Deep clean",
  ad_hoc: "Ad hoc",
};

function formatWhen(task: PortalTask): string {
  return formatPortalWhen(task.scheduledDate, task.timezone);
}

function TaskRow({ task }: { task: PortalTask }) {
  const typeLabel = TASK_TYPE_LABELS[task.taskType] ?? task.taskType;
  return (
    <Link
      href={`/portal/tasks/${task.id}`}
      className="gap-sm p-sm flex items-center rounded-lg"
      style={{ backgroundColor: "var(--neutral-30)", minHeight: "var(--touch-target-min)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-body text-highlight-10 truncate font-semibold">
          {task.listingName || "Cleaning task"}
        </p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          {typeLabel} - {formatWhen(task)}
        </p>
      </div>
      <PortalStatusChip status={task.status} />
      <ChevronRight size={18} aria-hidden="true" style={{ color: "var(--text-secondary)" }} />
    </Link>
  );
}

function TaskSection({ title, tasks }: { title: string; tasks: PortalTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-sm">
      <h2 className="text-body font-semibold" style={{ color: "var(--text-secondary)" }}>
        {title}
      </h2>
      <div className="gap-sm flex flex-col">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

export default function PortalTasksPage() {
  const [view, setView] = useState<"active" | "past">("active");
  const today = usePortalTasks("today");
  const upcoming = usePortalTasks("upcoming");
  const past = usePortalTasks("past", undefined, { enabled: view === "past" });

  const activeTasks = view === "active";
  const isLoading = activeTasks ? today.isLoading || upcoming.isLoading : past.isLoading;
  const todayTasks = today.data ?? [];
  const upcomingTasks = upcoming.data ?? [];
  const pastTasks = past.data ?? [];
  const activeEmpty = todayTasks.length === 0 && upcomingTasks.length === 0;
  const pastEmpty = pastTasks.length === 0;
  const showEmpty = !isLoading && (activeTasks ? activeEmpty : pastEmpty);

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h1 className="text-heading text-highlight-10 font-semibold">My cleans</h1>
        <div
          className="gap-xs flex rounded-lg p-1"
          style={{ backgroundColor: "var(--neutral-30)" }}
          role="tablist"
          aria-label="Task window"
        >
          {(["active", "past"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className="px-sm py-xs text-body rounded-md font-medium capitalize"
              style={{
                backgroundColor: view === v ? "var(--highlight-10)" : "transparent",
                color: view === v ? "var(--surface-60)" : "var(--highlight-10)",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body text-highlight-10"
        >
          Loading your cleans...
        </p>
      )}

      {showEmpty && (
        <div
          data-testid="portal-tasks-empty"
          className="p-lg space-y-xs rounded-lg text-center"
          style={{ backgroundColor: "var(--neutral-30)" }}
        >
          <p className="text-body text-highlight-10 font-semibold">
            {activeTasks ? "No cleans scheduled" : "No past cleans"}
          </p>
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            {activeTasks
              ? "You are all caught up. New cleans assigned to you will show here."
              : "Completed and cancelled cleans will appear here."}
          </p>
        </div>
      )}

      {!isLoading && activeTasks && !activeEmpty && (
        <div className="space-y-md">
          <TaskSection title="Today" tasks={todayTasks} />
          <TaskSection title="Upcoming" tasks={upcomingTasks} />
        </div>
      )}

      {!isLoading && !activeTasks && !pastEmpty && (
        <div className="space-y-md">
          <TaskSection title="Past" tasks={pastTasks} />
        </div>
      )}
    </div>
  );
}
