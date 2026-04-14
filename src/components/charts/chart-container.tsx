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
        className="flex items-center justify-center rounded-lg border bg-white"
        style={{ minHeight, borderColor: "var(--border)" }}
      >
        <p className="text-sm text-gray-400">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-white"
        style={{ minHeight, borderColor: "var(--border)" }}
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-white"
        style={{ minHeight, borderColor: "var(--border)" }}
      >
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border)" }}>
      {title && <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={minHeight}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
