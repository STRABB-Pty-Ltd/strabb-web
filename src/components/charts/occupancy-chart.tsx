"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

// Recharts forwards numeric font sizes to internal SVG <text> elements and uses
// getComputedStyle for measurement, so a `var(--text-body)` string is unsafe in
// these props. Mirror the token here as a plain number to keep the link
// documented while staying compatible.
const FONT_SIZE = 13; // mirrors var(--text-body)

interface OccupancyData {
  listing: string;
  occupancy: number;
}

interface OccupancyChartProps {
  data: OccupancyData[];
  loading?: boolean;
}

function getOccupancyColor(rate: number): string {
  if (rate < 50) return "var(--status-danger)";
  if (rate < 80) return "var(--highlight-10)";
  return "var(--status-success)";
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  return (
    <ChartContainer title="Occupancy by Listing" loading={loading} empty={data.length === 0}>
      <BarChart data={data}>
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
        <YAxis
          tick={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
        <Bar dataKey="occupancy" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getOccupancyColor(entry.occupancy)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
