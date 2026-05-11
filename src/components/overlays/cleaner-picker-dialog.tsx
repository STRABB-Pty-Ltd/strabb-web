"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCleaners, type MockTeamMember } from "@/lib/mock-team";

export interface CleanerAssignment {
  cleanerName: string;
  cleanerEmail: string;
  cleanerPhone: string;
}

type Mode = "choose" | "pick-existing" | "manual";

interface CleanerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CleanerAssignment;
  onSave: (next: CleanerAssignment) => void;
  saving?: boolean;
}

export function CleanerPickerDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving = false,
}: CleanerPickerDialogProps) {
  const cleaners = getCleaners();
  const [mode, setMode] = useState<Mode>("choose");
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState(initial.cleanerName);
  const [email, setEmail] = useState(initial.cleanerEmail);
  const [phone, setPhone] = useState(initial.cleanerPhone);

  // Reset state every time the dialog opens. The initial values come from
  // the current task so a re-open shows the latest assignment.
  useEffect(() => {
    if (open) {
      setMode("choose");
      setSelectedId(matchExistingId(cleaners, initial));
      setName(initial.cleanerName);
      setEmail(initial.cleanerEmail);
      setPhone(initial.cleanerPhone);
    }
  }, [open, initial, cleaners]);

  const handlePickExisting = (member: MockTeamMember) => {
    setSelectedId(member.id);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone ?? "");
  };

  const handleSave = () => {
    onSave({ cleanerName: name, cleanerEmail: email, cleanerPhone: phone });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign cleaner</DialogTitle>
          <DialogDescription>
            Pick someone from your cleaning team or enter details for a one-off cleaner.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="gap-base flex flex-col">
            <button
              type="button"
              onClick={() => setMode("pick-existing")}
              className="px-sm py-sm gap-base flex items-center rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Users size={20} style={{ color: "var(--strabb-secondary)" }} />
              <div>
                <p className="text-body text-highlight-10 font-semibold">Choose from team</p>
                <p className="text-body text-highlight-10">
                  {cleaners.length} cleaner{cleaners.length === 1 ? "" : "s"} available
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="px-sm py-sm gap-base flex items-center rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Pencil size={20} style={{ color: "var(--strabb-secondary)" }} />
              <div>
                <p className="text-body text-highlight-10 font-semibold">Enter manually</p>
                <p className="text-body text-highlight-10">For a one-off or external cleaner.</p>
              </div>
            </button>
          </div>
        )}

        {mode === "pick-existing" && (
          <div className="gap-sm flex flex-col">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="gap-xs text-body text-highlight-10 inline-flex w-fit items-center rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            {cleaners.length === 0 ? (
              <p className="text-body text-highlight-10">
                No cleaners on the team yet. Add one in Settings → Team, or enter details manually.
              </p>
            ) : (
              <div className="gap-xs flex flex-col">
                {cleaners.map((c) => {
                  const isSelected = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handlePickExisting(c)}
                      aria-pressed={isSelected}
                      className="px-sm py-base flex w-full flex-col rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                      style={{
                        borderColor: isSelected ? "var(--strabb-secondary)" : "var(--border)",
                        backgroundColor: isSelected
                          ? "color-mix(in srgb, var(--strabb-secondary) 8%, var(--surface-60))"
                          : "var(--surface-60)",
                      }}
                    >
                      <span className="text-body text-highlight-10 font-medium">{c.name}</span>
                      <span className="text-body text-highlight-10">{c.email}</span>
                      {c.phone && <span className="text-body text-highlight-10">{c.phone}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="gap-sm flex flex-col">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="gap-xs text-body text-highlight-10 inline-flex w-fit items-center rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div>
              <label
                htmlFor="cleaner-picker-name"
                className="mb-xs text-body text-highlight-10 block font-medium"
              >
                Cleaner name
              </label>
              <input
                id="cleaner-picker-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Cleaner name"
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{
                  backgroundColor: "var(--surface-60)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="cleaner-picker-email"
                className="mb-xs text-body text-highlight-10 block font-medium"
              >
                Cleaner email
              </label>
              <input
                id="cleaner-picker-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="cleaner@example.com"
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{
                  backgroundColor: "var(--surface-60)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="cleaner-picker-phone"
                className="mb-xs text-body text-highlight-10 block font-medium"
              >
                Cleaner phone
              </label>
              <input
                id="cleaner-picker-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+61 400 000 000"
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{
                  backgroundColor: "var(--surface-60)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
          </div>
        )}

        {mode !== "choose" && (
          <div className="gap-base flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-sm py-base text-body text-highlight-10 hover:bg-neutral-30 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (mode === "pick-existing" && !selectedId)}
              className="px-sm py-base text-body rounded-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-60"
              style={{
                backgroundColor: "var(--strabb-secondary)",
                color: "var(--surface-60)",
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function matchExistingId(cleaners: MockTeamMember[], initial: CleanerAssignment): string {
  if (!initial.cleanerEmail && !initial.cleanerName) return "";
  const match = cleaners.find(
    (c) => c.email === initial.cleanerEmail || c.name === initial.cleanerName,
  );
  return match?.id ?? "";
}
