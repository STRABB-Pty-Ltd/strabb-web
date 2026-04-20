"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompleteCleaningTask,
  useResendNotification,
  useUpdateCleaningTask,
} from "@/hooks/use-cleaning-tasks";
import { formatInPropertyTimezone, getTimezoneAbbr } from "@/lib/date-utils";
import type { CleaningTaskResponse } from "@/lib/schemas/cleaning-task";

interface CleaningTaskDialogProps {
  task: CleaningTaskResponse;
  propertyTimezone: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CleaningTaskDialog({
  task,
  propertyTimezone,
  propertyName,
  open,
  onOpenChange,
}: CleaningTaskDialogProps) {
  const [cleanerName, setCleanerName] = useState(task.cleanerName ?? "");
  const [cleanerEmail, setCleanerEmail] = useState(task.cleanerEmail ?? "");
  const [cleanerPhone, setCleanerPhone] = useState(task.cleanerPhone ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");

  const updateTask = useUpdateCleaningTask();
  const completeTask = useCompleteCleaningTask();
  const resendNotification = useResendNotification();

  const tz = propertyTimezone || "UTC";
  const tzAbbr = getTimezoneAbbr(task.scheduledDate, tz);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    notified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  async function handleSave() {
    await updateTask.mutateAsync({
      id: task.id,
      data: {
        cleanerName: cleanerName || null,
        cleanerEmail: cleanerEmail || null,
        cleanerPhone: cleanerPhone || null,
        notes: notes || null,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cleaning Task — {propertyName}</DialogTitle>
          <DialogDescription>
            <span
              className={`px-base py-xs text-body inline-block rounded-sm font-medium ${statusColors[task.status] ?? ""}`}
            >
              {task.status}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-sm text-body">
          <div>
            <Label className="text-muted-foreground">Scheduled</Label>
            <p className="font-medium">{formatInPropertyTimezone(task.scheduledDate, tz)}</p>
            <p className="text-muted-foreground text-body">{tzAbbr}</p>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div className="space-y-xs">
              <Label htmlFor="cleaner-name">Cleaner name</Label>
              <Input
                id="cleaner-name"
                value={cleanerName}
                onChange={(e) => setCleanerName(e.target.value)}
                placeholder="Cleaner name"
              />
            </div>
            <div className="space-y-xs">
              <Label htmlFor="cleaner-email">Email</Label>
              <Input
                id="cleaner-email"
                type="email"
                value={cleanerEmail}
                onChange={(e) => setCleanerEmail(e.target.value)}
                placeholder="cleaner@example.com"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="cleaner-phone">Phone</Label>
            <Input
              id="cleaner-phone"
              type="tel"
              value={cleanerPhone}
              onChange={(e) => setCleanerPhone(e.target.value)}
              placeholder="0400 000 000"
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions for this cleaning..."
              rows={3}
            />
          </div>

          <div className="gap-base flex">
            {task.status !== "completed" && task.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => completeTask.mutate(task.id)}
                disabled={completeTask.isPending}
              >
                {completeTask.isPending ? "Completing..." : "Mark complete"}
              </Button>
            )}
            {task.cleanerEmail && task.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resendNotification.mutate(task.id)}
                disabled={resendNotification.isPending}
              >
                {resendNotification.isPending ? "Sending..." : "Resend notification"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>
            {updateTask.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
