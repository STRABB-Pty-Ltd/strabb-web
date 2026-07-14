"use client";

import { Drawer } from "@/components/ui/drawer";

interface DrillDownPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}

/* Thin wrapper over the shared ui/drawer primitive - keeps the drill-down
   family's API (accent bar always on, drilldown width, scrimmed) stable for
   its detail/form drawer consumers. */
export function DrillDownPanel({
  open,
  onClose,
  title,
  accentColor = "var(--highlight-10)",
  children,
}: DrillDownPanelProps) {
  return (
    <Drawer open={open} onClose={onClose} title={title} accentColor={accentColor}>
      {children}
    </Drawer>
  );
}
