"use client";

import { Toaster } from "sonner";

export function ToastContainer() {
  return <Toaster position="bottom-right" duration={5000} richColors closeButton />;
}
