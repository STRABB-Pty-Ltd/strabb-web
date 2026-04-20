"use client";

export function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" className="px-md pb-md flex-1 overflow-y-auto">
      {children}
    </main>
  );
}
