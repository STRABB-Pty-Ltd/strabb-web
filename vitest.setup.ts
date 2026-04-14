import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement ResizeObserver — components that rely on it
// (e.g. responsive GanttView) need a no-op stub during unit tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

afterEach(() => {
  cleanup();
});
