"use client";

import { ResponsiveContainer } from "recharts";

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
  minHeight = 300,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          minHeight,
          backgroundColor: "var(--surface-card)",
          color: "var(--brand-10)",
          opacity: 0.7,
        }}
      >
        <p className="text-sm">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ minHeight, backgroundColor: "var(--surface-card)" }}
      >
        <p className="text-sm" style={{ color: "var(--status-issues)" }}>
          {error}
        </p>
      </div>
    );
  }

  if (empty) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          minHeight,
          backgroundColor: "var(--surface-card)",
          color: "var(--brand-10)",
          opacity: 0.7,
        }}
      >
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--surface-card)" }}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--brand-10)" }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={minHeight}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
