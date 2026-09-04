"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

// Inline-editable single-line text. Local draft so typing does not fire a
// request per keystroke; commits on blur (and Enter) when the value is valid
// and actually changed. Re-syncs when the server value changes. Shared by the
// checklist-template editor and the per-property checklist editor.
export function EditableText({
  value,
  onCommit,
  ariaLabel,
  disabled,
  validate,
  placeholder,
}: {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  validate: (candidate: string) => boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!validate(trimmed)) {
      setError(true);
      return;
    }
    setError(false);
    if (trimmed === value) return;
    onCommit(trimmed);
  };

  return (
    <Input
      aria-label={ariaLabel}
      aria-invalid={error}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setError(false);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
