"use client";

import { useEffect } from "react";
import { Toaster, toast as sonnerToast } from "sonner";

import { useAppStore } from "@/stores/app-store";

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;

    for (const toast of toasts) {
      const fn =
        toast.type === "success"
          ? sonnerToast.success
          : toast.type === "error"
            ? sonnerToast.error
            : toast.type === "warning"
              ? sonnerToast.warning
              : sonnerToast.info;
      // Errors stay long enough to read + recover (sticky-style); other toasts auto-dismiss.
      const duration = toast.type === "error" ? 10000 : 5000;
      fn(toast.message, { id: toast.id, duration });
      removeToast(toast.id);
    }
  }, [toasts, removeToast]);

  return <Toaster position="bottom-right" duration={5000} richColors closeButton />;
}
