import type { ReactNode } from "react";

import { PortalNav, PortalTopNav } from "./_components/portal-nav";

/**
 * Shell for the cleaner portal. Deliberately does NOT reuse the desktop
 * authenticated shell (no 16vw sidebar, no submenu bar). Phone-first: below md
 * it is the original compact top bar + a content column capped at 480px + a
 * fixed bottom tab bar. At md+ this is a conservative responsive first-pass
 * (not a redesign - flagged for design review): the column relaxes to a
 * readable max-width, the header gains an inline top nav, and the phone bottom
 * bar is hidden. Only design tokens are shared with the rest of the app, never
 * the shell layout vars.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface-60)" }}>
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col md:max-w-3xl">
        <header
          className="px-md py-sm flex items-center justify-between gap-4"
          style={{ borderBottom: "var(--hairline) solid var(--border)" }}
        >
          <span className="text-subheading text-highlight-10 font-semibold tracking-tight">
            STRABB
          </span>
          <PortalTopNav />
        </header>
        {/* Bottom padding clears the fixed phone bottom bar; at md+ the bar is
            gone, so drop back to the normal md gutter. */}
        <main className="px-md pt-md md:pb-md flex-1 pb-[calc(var(--touch-target-min)+var(--space-xl))]">
          {children}
        </main>
        <PortalNav />
      </div>
    </div>
  );
}
