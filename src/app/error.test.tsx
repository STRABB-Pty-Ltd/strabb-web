import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./error";

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("boom") as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("Error boundary", () => {
  it("renders the error panel and reports to App Insights without throwing", () => {
    // trackError no-ops when NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
    // is unset (always true in tests), so this just proves the effect is
    // safe to run - see src/lib/app-insights.test.ts for the gating itself.
    expect(() => render(<ErrorBoundary error={makeError()} reset={vi.fn()} />)).not.toThrow();

    expect(screen.getByTestId("error-page")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("wires the Try again button to reset()", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={makeError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows the error digest as a reference when present, and links to the dashboard", () => {
    render(<ErrorBoundary error={makeError("abc123")} reset={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
