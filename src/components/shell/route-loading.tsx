import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Route-segment loading fallback (Next.js loading.tsx convention). Scoped to
// just the canvas content area - unlike PageLoading (the shell's own Suspense
// fallback in app-shell.tsx, which mocks up the full topnav/sidebar/submenu),
// this renders inside an already-mounted AppShell, so it must not redraw that
// chrome. Each page already shows its own richer skeleton once its data
// queries start (see dashboard/page.tsx's isLoading branch); this only covers
// the brief route-segment-transition window before that.
export function RouteLoading() {
  return (
    <div
      className="gap-sm flex min-h-[50vh] flex-col items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <LoadingSpinner />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
