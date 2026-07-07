"use client";

import { useEffect } from "react";

import "./globals.css";

// Last-resort boundary: only fires when the ROOT layout itself throws, so it
// replaces <html>/<body> entirely and cannot depend on Providers or any
// context (session, query client, toast store) - the failure may be in one of
// those. Deliberately plainer than error.tsx/not-found.tsx for that reason,
// but keeps the same visual language (globals.css tokens, same copy tone).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught an error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="p-lg flex min-h-screen flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="mb-base text-subheading font-semibold">Something went wrong</h2>
            <p className="mb-md text-body text-highlight-10">
              STRABB hit an unexpected error and could not load. Try reloading the page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-sm py-base text-body bg-primary text-primary-foreground hover:bg-primary/80 inline-flex items-center rounded-lg font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
