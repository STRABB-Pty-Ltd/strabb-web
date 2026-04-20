"use client";

export function LogoSection() {
  return (
    <div
      className="flex shrink-0 items-center"
      style={{
        height: "var(--topnav-height)",
        paddingLeft: "var(--space-md)",
        paddingRight: "var(--space-md)",
      }}
    >
      <span className="font-data text-heading font-bold" style={{ color: "var(--strabb-primary)" }}>
        STRABB
      </span>
    </div>
  );
}
