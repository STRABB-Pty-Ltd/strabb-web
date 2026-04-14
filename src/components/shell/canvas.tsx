"use client";

export function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto" style={{ padding: "var(--space-md)" }}>
      {children}
    </main>
  );
}
