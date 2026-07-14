"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Pencil, Users, X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useTeamMembers } from "@/hooks/use-team";
import type { TeamMember } from "@/lib/schemas/team";
import { Z } from "@/lib/z-index";

export interface CleanerAssignment {
  // Set when a real team cleaner is chosen; null for a one-off free-text cleaner.
  assignedUserId: string | null;
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

const EXIT_MS = 200;

export function CleanerPickerDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving = false,
}: CleanerPickerDialogProps) {
  // The picker's "choose from team" list is the real cleaner roster from
  // GET /users?role=cleaner (owner/admin surface). The API denormalises the
  // chosen user's name/email/phone into the task's free-text trio on assign.
  const membersQuery = useTeamMembers({ role: "cleaner", enabled: open });
  const cleaners = membersQuery.data?.data ?? [];
  const panelRef = useRef<HTMLDivElement>(null);
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const [mode, setMode] = useState<Mode>("choose");
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState(initial.cleanerName);
  const [email, setEmail] = useState(initial.cleanerEmail);
  const [phone, setPhone] = useState(initial.cleanerPhone);

  // Reset state only on the false-to-true transition of `open` so clicking a
  // mode button doesn't immediately reset mode back to "choose" via this effect.
  // `initial` is recreated by the parent on every render; reading it inside the
  // effect is intentional. Preselect the assigned user directly by its FK.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setMode("choose");
      setSelectedId(initial.assignedUserId ?? "");
      setName(initial.cleanerName);
      setEmail(initial.cleanerEmail);
      setPhone(initial.cleanerPhone);
    }
    wasOpen.current = open;
  }, [open, initial]);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  useClickOutside(panelRef, handleClose, open);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!shouldRender) return null;

  const handlePickExisting = (member: TeamMember) => {
    setSelectedId(member.id);
    setName(member.fullName);
    setEmail(member.email);
    // The user roster carries no phone; the API fills it from the user record
    // on assign, so leave it blank here rather than guessing.
    setPhone("");
  };

  const handleSave = () => {
    if (mode === "pick-existing") {
      const picked = cleaners.find((c) => c.id === selectedId);
      onSave({
        assignedUserId: selectedId,
        cleanerName: picked?.fullName ?? name,
        cleanerEmail: picked?.email ?? email,
        cleanerPhone: "",
      });
      return;
    }
    // Manual mode: a one-off cleaner with no account - free-text trio, null FK.
    onSave({ assignedUserId: null, cleanerName: name, cleanerEmail: email, cleanerPhone: phone });
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cleaner-picker-title"
      className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
      style={{
        zIndex: Z.DRAWER,
        top: "calc(var(--overlay-top) + var(--space-md) - 2px)",
        // Sit immediately to the left of the drill-down panel with the same
        // gap the drawer uses from the viewport edge. --drilldown-panel-width
        // (not the raw --drilldown-width) so this stays flush against the
        // drill-down panel's actual clamped width below lg.
        right: "calc(var(--drilldown-panel-width) + var(--space-md) * 2)",
        bottom: "var(--overlay-bottom)",
        width: "var(--drilldown-panel-width)",
        animation: !open ? `fadeOut ${EXIT_MS}ms ease-in forwards` : `fadeIn ${EXIT_MS}ms ease-out`,
      }}
    >
      <div
        className="px-sm py-sm flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h2 id="cleaner-picker-title" className="text-body text-highlight-10 font-semibold">
            Assign cleaner
          </h2>
          <p className="text-body text-highlight-10">
            Pick someone from your cleaning team or enter details for a one-off cleaner.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close cleaner picker"
          className="p-xs text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          data-no-elevate
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-sm gap-sm flex flex-1 flex-col overflow-y-auto">
        {mode === "choose" && (
          <>
            <button
              type="button"
              onClick={() => setMode("pick-existing")}
              className="px-sm py-sm gap-base flex items-center rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Users size={20} style={{ color: "var(--highlight-10)" }} />
              <div>
                <p className="text-body text-highlight-10 font-semibold">Choose from team</p>
                <p className="text-body text-highlight-10">
                  {membersQuery.isLoading
                    ? "Loading cleaners..."
                    : `${cleaners.length} cleaner${cleaners.length === 1 ? "" : "s"} available`}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="px-sm py-sm gap-base flex items-center rounded-lg border text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ borderColor: "var(--border)" }}
            >
              <Pencil size={20} style={{ color: "var(--highlight-10)" }} />
              <div>
                <p className="text-body text-highlight-10 font-semibold">Enter manually</p>
                <p className="text-body text-highlight-10">For a one-off or external cleaner.</p>
              </div>
            </button>
          </>
        )}

        {mode === "pick-existing" && (
          <>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="gap-xs text-body text-highlight-10 inline-flex w-fit items-center rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
            {membersQuery.isLoading ? (
              <p className="text-body text-highlight-10">Loading cleaners...</p>
            ) : cleaners.length === 0 ? (
              <p className="text-body text-highlight-10">
                No cleaners on the team yet. Invite one in Settings &gt; Team, or enter details
                manually.
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
                        borderColor: isSelected ? "var(--highlight-10)" : "var(--border)",
                        backgroundColor: isSelected
                          ? "color-mix(in srgb, var(--highlight-10) 8%, var(--surface-60))"
                          : "var(--surface-60)",
                      }}
                    >
                      <span className="text-body text-highlight-10 font-medium">{c.fullName}</span>
                      <span className="text-body text-highlight-10">{c.email}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {mode === "manual" && (
          <>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="gap-xs text-body text-highlight-10 inline-flex w-fit items-center rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <ArrowLeft size={14} aria-hidden="true" />
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
          </>
        )}
      </div>

      {mode !== "choose" && (
        <div
          className="gap-base px-sm py-sm flex justify-end border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={handleClose}
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
              backgroundColor: "var(--highlight-10)",
              color: "var(--surface-60)",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
