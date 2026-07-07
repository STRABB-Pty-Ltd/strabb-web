"use client";

// Last-resort boundary: catches errors thrown by the ROOT layout itself, where
// error.tsx cannot reach. It replaces the whole document, so it must render its
// own <html>/<body> and cannot rely on the app shell, providers, Tailwind, or
// design tokens (any of which could be the thing that threw). Everything here
// is intentionally self-contained inline styles. Brand navy #15206b matches
// --highlight-10.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#15206b",
        }}
      >
        <div
          data-testid="global-error-page"
          style={{ maxWidth: 360, padding: 24, textAlign: "center" }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 16px", lineHeight: 1.5 }}>
            The app hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#15206b",
              color: "#fafafa",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>Reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
