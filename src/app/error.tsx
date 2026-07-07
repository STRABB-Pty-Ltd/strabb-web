"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// App Router segment error boundary - catches errors thrown while rendering
// a route (server or client). Mirrors src/components/shell/error-boundary.tsx
// so this reads as the same failure state, just triggered by the router
// instead of a client render error inside the shell.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught an error:", error);
  }, [error]);

  return (
    <div className="p-lg flex min-h-screen flex-1 items-center justify-center">
      <div className="max-w-md text-center">
        <AlertTriangle size={55} className="mb-md text-highlight-10 mx-auto" aria-hidden="true" />
        <h2 className="mb-base text-subheading font-semibold">Something went wrong</h2>
        <p className="mb-md text-body text-highlight-10">
          An unexpected error occurred. Try reloading this page.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mb-md p-sm text-body rounded-md border text-left">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-base text-status-danger overflow-auto whitespace-pre-wrap">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}
        <button
          type="button"
          onClick={reset}
          className="gap-base px-sm py-base text-body bg-primary text-primary-foreground hover:bg-primary/80 inline-flex items-center rounded-lg font-medium"
        >
          <RefreshCw size={13} aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
