import { render, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastSuccess, toastError, toastWarning, toastInfo } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
  },
}));

import { useAppStore } from "@/stores/app-store";
import { ToastContainer } from "./toast-container";

describe("ToastContainer (store bridge)", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    toastWarning.mockReset();
    toastInfo.mockReset();
    useAppStore.setState({ toasts: [] });
  });

  afterEach(() => {
    useAppStore.setState({ toasts: [] });
  });

  it("forwards a success toast to sonner and removes it from the store", () => {
    render(<ToastContainer />);
    act(() => {
      useAppStore.getState().addToast({ type: "success", message: "Saved" });
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Saved",
      expect.objectContaining({ id: expect.any(String) }),
    );
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it("routes by type to the correct sonner method", () => {
    render(<ToastContainer />);
    act(() => {
      useAppStore.getState().addToast({ type: "error", message: "Boom" });
      useAppStore.getState().addToast({ type: "warning", message: "Watch out" });
      useAppStore.getState().addToast({ type: "info", message: "FYI" });
    });

    expect(toastError).toHaveBeenCalledWith("Boom", expect.any(Object));
    expect(toastWarning).toHaveBeenCalledWith("Watch out", expect.any(Object));
    expect(toastInfo).toHaveBeenCalledWith("FYI", expect.any(Object));
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });
});
