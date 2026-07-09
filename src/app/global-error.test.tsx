import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "./global-error";

function makeError(digest?: string): Error & { digest?: string } {
  const err = new Error("root layout boom") as Error & { digest?: string };
  if (digest) err.digest = digest;
  return err;
}

describe("GlobalError", () => {
  it("renders a self-contained recovery page with a stable test-id", () => {
    render(<GlobalError error={makeError()} reset={vi.fn()} />);
    expect(screen.getByTestId("global-error-page")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("wires Try again to reset()", () => {
    const reset = vi.fn();
    render(<GlobalError error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
