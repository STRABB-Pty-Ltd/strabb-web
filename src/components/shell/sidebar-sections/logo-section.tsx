"use client";

export function LogoSection() {
  return (
    <div
      className="flex items-center border-b"
      style={{
        padding: "var(--space-md)",
        borderColor: "var(--border)",
      }}
    >
      <span className="font-data text-base font-bold" style={{ color: "var(--strabb-primary)" }}>
        STRABB
      </span>
    </div>
  );
}
