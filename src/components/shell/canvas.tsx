"use client";

export function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <main
      role="main"
      // Bottom padding clears the fixed phone bottom bar (M.1's
      // MobileBottomNav); at md+ the bar is gone, so drop back to px-md's
      // normal pb-md gutter - mirrors the cleaner portal's same pattern.
      className="px-md md:pb-md flex-1 overflow-y-auto pb-[calc(var(--touch-target-min)+var(--space-xl))]"
      // pt = px-md − 2px so the visual gap from the horizon separator to
      // the canvas content equals the visual gap from the sidebar separator
      // to the canvas content (which is px-md − 2px because the vertical
      // separator overlaps the canvas's left-padding by 2px). Both gaps
      // track --space-md together - change the token, both update.
      style={{ paddingTop: "calc(var(--space-md) - 2px)" }}
    >
      {children}
    </main>
  );
}
