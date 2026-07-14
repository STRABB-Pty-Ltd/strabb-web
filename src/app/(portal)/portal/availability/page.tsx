"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddTimeOff,
  useAvailability,
  useDeleteTimeOff,
  useUpdateWeeklyAvailability,
} from "@/lib/api-hooks/portal-api";
import { ApiError } from "@/lib/api-client";
import {
  timeOffSchema,
  WEEKDAY_LABELS,
  weeklyWindowSchema,
  type WeeklyAvailability,
} from "@/lib/schemas/portal";
import { useAppStore } from "@/stores/app-store";

function toastError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export default function PortalAvailabilityPage() {
  const { data, isLoading } = useAvailability();
  const updateWeekly = useUpdateWeeklyAvailability();
  const addTimeOff = useAddTimeOff();
  const deleteTimeOff = useDeleteTimeOff();
  const addToast = useAppStore((s) => s.addToast);

  const [weekly, setWeekly] = useState<WeeklyAvailability[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [offStart, setOffStart] = useState("");
  const [offEnd, setOffEnd] = useState("");
  const [offNote, setOffNote] = useState("");

  useEffect(() => {
    if (data && !seeded) {
      setWeekly(
        data.weekly.map((w) => ({
          ...w,
          startTime: w.startTime.slice(0, 5),
          endTime: w.endTime.slice(0, 5),
        })),
      );
      setSeeded(true);
    }
  }, [data, seeded]);

  const addWindow = (weekday: number) =>
    setWeekly((prev) => [...prev, { weekday, startTime: "09:00", endTime: "17:00" }]);
  const removeWindow = (idx: number) => setWeekly((prev) => prev.filter((_, i) => i !== idx));
  const editWindow = (idx: number, patch: Partial<WeeklyAvailability>) =>
    setWeekly((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));

  const handleSaveWeekly = () => {
    for (const w of weekly) {
      const parsed = weeklyWindowSchema.safeParse(w);
      if (!parsed.success) {
        addToast({
          type: "error",
          message: parsed.error.issues[0]?.message ?? "Invalid availability window",
        });
        return;
      }
    }
    updateWeekly.mutate(weekly, {
      onSuccess: () => addToast({ type: "success", message: "Availability saved" }),
      onError: (err) => addToast({ type: "error", message: toastError(err) }),
    });
  };

  const handleAddTimeOff = () => {
    const parsed = timeOffSchema.safeParse({
      startAt: offStart,
      endAt: offEnd,
      note: offNote.trim() === "" ? undefined : offNote.trim(),
    });
    if (!parsed.success) {
      addToast({ type: "error", message: parsed.error.issues[0]?.message ?? "Invalid time off" });
      return;
    }
    addTimeOff.mutate(parsed.data, {
      onSuccess: () => {
        addToast({ type: "success", message: "Time off added" });
        setOffStart("");
        setOffEnd("");
        setOffNote("");
      },
      onError: (err) => addToast({ type: "error", message: toastError(err) }),
    });
  };

  const handleDeleteTimeOff = (id: string) => {
    deleteTimeOff.mutate(id, {
      onError: (err) => addToast({ type: "error", message: toastError(err) }),
    });
  };

  const timeOff = data?.timeOff ?? [];

  return (
    <div className="space-y-md">
      <h1 className="text-heading text-highlight-10 font-semibold">Availability</h1>

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body text-highlight-10"
        >
          Loading...
        </p>
      )}

      <section className="space-y-sm">
        <h2 className="text-subheading text-highlight-10 font-semibold">Weekly hours</h2>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Set the hours you are usually available. Leave a day empty if you have no fixed hours.
        </p>
        <div className="gap-sm flex flex-col">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const entries = weekly.map((w, i) => ({ w, i })).filter((x) => x.w.weekday === weekday);
            return (
              <div
                key={label}
                className="p-sm space-y-xs rounded-lg"
                style={{ backgroundColor: "var(--neutral-30)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-body text-highlight-10 font-semibold">{label}</span>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={() => addWindow(weekday)}
                    aria-label={`Add hours for ${label}`}
                  >
                    <Plus size={14} aria-hidden="true" /> Add
                  </Button>
                </div>
                {entries.length === 0 && (
                  <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                    No hours set
                  </p>
                )}
                {entries.map(({ w, i }) => (
                  <div key={i} className="gap-xs flex items-center">
                    <Input
                      type="time"
                      aria-label={`${label} start`}
                      value={w.startTime}
                      onChange={(e) => editWindow(i, { startTime: e.target.value })}
                      className="w-auto"
                    />
                    <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                      to
                    </span>
                    <Input
                      type="time"
                      aria-label={`${label} end`}
                      value={w.endTime}
                      onChange={(e) => editWindow(i, { endTime: e.target.value })}
                      className="w-auto"
                    />
                    <Button
                      type="button"
                      variant="quiet"
                      size="icon-sm"
                      onClick={() => removeWindow(i)}
                      aria-label={`Remove ${label} window`}
                      className="ml-auto"
                    >
                      <X size={16} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          onClick={handleSaveWeekly}
          disabled={updateWeekly.isPending}
          className="min-h-[var(--touch-target-min)] w-full font-semibold"
        >
          {updateWeekly.isPending ? "Saving..." : "Save weekly hours"}
        </Button>
      </section>

      <section className="space-y-sm">
        <h2 className="text-subheading text-highlight-10 font-semibold">Time off</h2>
        <div className="gap-sm flex flex-col">
          {timeOff.length === 0 && (
            <p className="text-body" style={{ color: "var(--text-secondary)" }}>
              No time off booked.
            </p>
          )}
          {timeOff.map((block) => (
            <div
              key={block.id}
              className="p-sm gap-sm flex items-center rounded-lg"
              style={{ backgroundColor: "var(--neutral-30)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-body text-highlight-10 font-medium">
                  {block.startAt.slice(0, 16).replace("T", " ")} -{" "}
                  {block.endAt.slice(0, 16).replace("T", " ")}
                </p>
                {block.note && (
                  <p className="text-body truncate" style={{ color: "var(--text-secondary)" }}>
                    {block.note}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="quiet"
                size="icon-sm"
                onClick={() => handleDeleteTimeOff(block.id)}
                aria-label="Remove time off"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>

        <div
          className="p-sm space-y-xs rounded-lg"
          style={{ backgroundColor: "var(--neutral-30)" }}
        >
          <label className="space-y-xs block">
            <span className="text-body text-highlight-10 font-medium">From</span>
            <Input
              type="datetime-local"
              aria-label="Time off start"
              value={offStart}
              onChange={(e) => setOffStart(e.target.value)}
            />
          </label>
          <label className="space-y-xs block">
            <span className="text-body text-highlight-10 font-medium">To</span>
            <Input
              type="datetime-local"
              aria-label="Time off end"
              value={offEnd}
              onChange={(e) => setOffEnd(e.target.value)}
            />
          </label>
          <label className="space-y-xs block">
            <span className="text-body text-highlight-10 font-medium">Note (optional)</span>
            <Input
              type="text"
              aria-label="Time off note"
              value={offNote}
              onChange={(e) => setOffNote(e.target.value)}
            />
          </label>
          <Button
            type="button"
            onClick={handleAddTimeOff}
            disabled={addTimeOff.isPending}
            className="min-h-[var(--touch-target-min)] w-full font-semibold"
          >
            {addTimeOff.isPending ? "Adding..." : "Add time off"}
          </Button>
        </div>
      </section>
    </div>
  );
}
