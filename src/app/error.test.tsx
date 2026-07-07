import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./error";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("boom") as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("Error boundary", () => {
  it("renders the error panel and logs the error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={makeError()} reset={vi.fn()} />);

    expect(screen.getByTestId("error-page")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("wires the Try again button to reset()", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<ErrorBoundary error={makeError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows the error digest as a reference when present, and links to the dashboard", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={makeError("abc123")} reset={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
