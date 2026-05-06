"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

// Recharts forwards numeric font sizes to internal SVG <text> elements and uses
// getComputedStyle for measurement, so a `var(--text-body)` string is unsafe in
// these props. Mirror the token here as a plain number to keep the link
// documented while staying compatible.
const FONT_SIZE = 13; // mirrors var(--text-body)

interface RevenueByListingData {
  listing: string;
  revenue: number;
  color: string;
}

interface RevenueByListingChartProps {
  data: RevenueByListingData[];
  loading?: boolean;
}

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export function RevenueByListingChart({ data, loading }: RevenueByListingChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <ChartContainer title="Revenue by Listing" loading={loading} empty={data.length === 0}>
      <BarChart data={sorted}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          dataKey="listing"
          tick={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }}
          interval={0}
          angle={-20}
          textAnchor="end"
          // 55 = --space-xl
          height={55}
        />
        <YAxis tick={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }} tickFormatter={formatAUD} />
        <ChartTooltip formatter={(value) => [formatAUD(Number(value)), "Revenue"]} />
        <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
