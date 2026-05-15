"use client";

import { BarChart3 } from "lucide-react";
import { ResponsiveContainer } from "recharts";

import { EmptyState } from "@/components/ui/empty-state";

interface ChartContainerProps {
  title?: string;
  // Plain-language summary of what the chart shows. Rendered as
  // role="img" + aria-label on the chart's SVG wrapper so screen-reader
  // users get an equivalent to the visual data (WCAG 1.1.1).
  summary?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  children: React.ReactNode;
  minHeight?: number;
}

export function ChartContainer({
  title,
  summary,
  loading = false,
  error = null,
  empty = false,
  children,
  // 377 sits on the Fibonacci ladder (--space-Fib-377 territory)
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
        style={{ minHeight, backgroundColor: "var(--neutral-30)" }}
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
        style={{ minHeight, backgroundColor: "var(--neutral-30)" }}
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
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--neutral-30)" }}>
      {title && (
        <h3 className="mb-sm text-body font-semibold" style={{ color: "var(--highlight-10)" }}>
          {title}
        </h3>
      )}
      <div role={summary ? "img" : undefined} aria-label={summary}>
        <ResponsiveContainer width="100%" height={minHeight}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
