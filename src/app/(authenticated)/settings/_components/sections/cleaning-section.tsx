"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/use-team";
import { useSettingsForm } from "@/lib/api-hooks/settings-api";

export function CleaningSection() {
  const { values, patch, save, isSaving, dirty } = useSettingsForm("cleaning", {
    autoAssign: false,
    // The chosen cleaner's user id is the source of truth; name + email are
    // denormalised alongside it so any consumer of the blob has them without a
    // second lookup. Legacy blobs may carry only the free-text name/email.
    defaultCleanerId: "",
    defaultCleaner: "",
    defaultCleanerEmail: "",
  });

  // Real cleaner roster (GET /users?role=cleaner) - same source the booking
  // drawer's cleaner picker uses, replacing the old free-text name/email fields.
  const cleanersQuery = useTeamMembers({ role: "cleaner" });
  const cleaners = cleanersQuery.data?.data ?? [];

  const handleCleanerChange = (id: string) => {
    const chosen = cleaners.find((c) => c.id === id);
    patch({
      defaultCleanerId: id,
      defaultCleaner: chosen?.fullName ?? "",
      defaultCleanerEmail: chosen?.email ?? "",
    });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Cleaning</h2>
        <p className="text-body text-highlight-10">Default cleaning task configuration.</p>
      </div>

      <div className="space-y-sm">
        <div
          className="px-sm py-sm flex items-center justify-between rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p id="auto-assign-label" className="text-body text-highlight-10 font-medium">
              Auto-assign Tasks
            </p>
            <p className="text-body text-highlight-10">
              Automatically assign cleaning tasks to the default cleaner
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.autoAssign}
            aria-labelledby="auto-assign-label"
            onClick={() => patch({ autoAssign: !values.autoAssign })}
            className="h-md relative w-lg rounded-full transition-colors outline-none before:absolute before:top-1/2 before:left-1/2 before:h-[var(--touch-target-min)] before:w-[var(--touch-target-min)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            style={{
              backgroundColor: values.autoAssign ? "var(--highlight-10)" : "var(--neutral-30)",
            }}
          >
            {/* Thumb 14x14 with locked left positions (2 / 18) gives symmetric 2px margins inside a w-lg (34px) track. */}
            <span
              className="bg-surface-60 absolute top-[3px] h-[14px] w-[14px] rounded-full shadow transition-transform"
              style={{ left: values.autoAssign ? 18 : 2 }}
            />
          </button>
        </div>

        <div>
          <label
            htmlFor="cleaning-default-cleaner"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Cleaner
          </label>
          <Select
            id="cleaning-default-cleaner"
            value={values.defaultCleanerId}
            onChange={(e) => handleCleanerChange(e.target.value)}
            disabled={cleanersQuery.isLoading}
            options={[
              { value: "", label: "None" },
              ...cleaners.map((cleaner) => ({ value: cleaner.id, label: cleaner.fullName })),
            ]}
          />
          {values.defaultCleanerEmail && (
            <p className="mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
              {values.defaultCleanerEmail}
            </p>
          )}
          {!cleanersQuery.isLoading && cleaners.length === 0 && (
            <p className="mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
              No cleaners on the team yet. Invite one from the Team settings.
            </p>
          )}
        </div>
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body text-highlight-10 font-semibold">Checklist Templates</h3>
        <div className="space-y-base text-body text-highlight-10">
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Standard Checkout Clean</span>
            <span className="text-body text-highlight-10">12 items</span>
          </div>
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Deep Clean</span>
            <span className="text-body text-highlight-10">18 items</span>
          </div>
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Quick Inspection</span>
            <span className="text-body text-highlight-10">5 items</span>
          </div>
        </div>
      </div>

      <Button type="button" onClick={save} disabled={!dirty || isSaving}>
        {isSaving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
