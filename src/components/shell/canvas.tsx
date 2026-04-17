"use client";

export function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" className="flex-1 overflow-y-auto px-md pb-md">
      {children}
    </main>
  );
}
