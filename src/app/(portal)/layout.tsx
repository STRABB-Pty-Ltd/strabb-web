import type { ReactNode } from "react";

import { PortalNav } from "./_components/portal-nav";

/**
 * Mobile-first shell for the cleaner portal. Deliberately does NOT reuse the
 * desktop authenticated shell (no 16vw sidebar, no submenu bar): a compact top
 * bar, a content column capped for phone reading, and a fixed bottom tab bar.
 * Only design tokens are shared with the rest of the app, never the shell
 * layout vars.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface-60)" }}>
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col">
        <header
          className="px-md py-sm flex items-center"
          style={{ borderBottom: "var(--hairline) solid var(--border)" }}
        >
          <span className="text-subheading text-highlight-10 font-semibold tracking-tight">
            STRABB
          </span>
        </header>
        <main
          className="px-md py-md flex-1"
          style={{ paddingBottom: "calc(var(--touch-target-min) + var(--space-xl))" }}
        >
          {children}
        </main>
        <PortalNav />
      </div>
    </div>
  );
}
