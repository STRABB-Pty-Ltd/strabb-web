"use client";

import { BarChart3 } from "lucide-react";
import { ResponsiveContainer } from "recharts";

import { EmptyState } from "@/components/ui/empty-state";

interface ChartContainerProps {
  title?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  children: React.ReactNode;
  minHeight?: number;
}

export function ChartContainer({
  title,
  loading = false,
  error = null,
  empty = false,
  children,
  minHeight = 377,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div
        className="animate-pulse rounded-xl"
        role="presentation"
        aria-busy="true"
        style={{ minHeight, backgroundColor: "var(--neutral-30)" }}
      />
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ minHeight, backgroundColor: "var(--surface-card)" }}
      >
        <p className="text-body" style={{ color: "var(--status-issues)" }}>
          {error}
        </p>
      </div>
    );
  }

  if (empty) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ minHeight, backgroundColor: "var(--surface-card)" }}
      >
        <EmptyState
          icon={BarChart3}
          title="No data available"
          description="Try adjusting the timeframe or filters."
        />
      </div>
    );
  }

  return (
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      {title && (
        <h3 className="mb-sm text-body font-semibold" style={{ color: "var(--brand-10)" }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={minHeight}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
