import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom in this config ships without a Web Storage implementation, so any code
// behind the persisted store (zustand persist) would throw on setItem. Provide
// a minimal in-memory localStorage so those code paths run under test.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
}

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
