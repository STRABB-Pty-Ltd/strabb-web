"use client";

import { useEffect } from "react";

import { trackError } from "@/lib/app-insights";

// Root error boundary (F.6a): catches failures in the root layout itself, so
// it must render its own <html>/<body> and cannot rely on the app's fonts,
// CSS, or providers - hence inline styles. Reports to App Insights, offers a
// reload.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</h2>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "#555" }}>
          An unexpected error occurred. Please try again, or reload the page if it persists.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
