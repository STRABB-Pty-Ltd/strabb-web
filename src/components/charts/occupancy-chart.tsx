"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { occupancyRateToPercent } from "@/lib/percent";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

// Recharts forwards numeric font sizes to internal SVG <text> elements and uses
// getComputedStyle for measurement, so a `var(--text-body)` string is unsafe in
// these props. Mirror the token here as a plain number to keep the link
// documented while staying compatible.
const FONT_SIZE = 13; // mirrors var(--text-body)

export interface OccupancyData {
  listing: string;
  occupancy: number;
  // Nights from the api's OccupancyRecord, so the summary can report the true
  // weighted aggregate (sum of booked / sum of sellable) instead of an
  // unweighted mean of the listing rates.
  bookedDays: number;
  availableDays: number;
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

export function buildSummary(data: OccupancyData[]): string {
  if (data.length === 0) return "";
  const max = data.reduce((a, b) => (b.occupancy > a.occupancy ? b : a));
  const min = data.reduce((a, b) => (b.occupancy < a.occupancy ? b : a));
  const totalBooked = data.reduce((sum, d) => sum + d.bookedDays, 0);
  const totalAvailable = data.reduce((sum, d) => sum + d.availableDays, 0);
  const avg = totalAvailable > 0 ? occupancyRateToPercent(totalBooked / totalAvailable) : 0;
  return (
    `Occupancy across ${data.length} listings, averaging ${avg} percent. ` +
    `Highest is ${max.listing} at ${max.occupancy} percent, ` +
    `lowest is ${min.listing} at ${min.occupancy} percent.`
  );
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  return (
    <ChartContainer
      title="Occupancy by Listing"
      summary={buildSummary(data)}
      loading={loading}
      empty={data.length === 0}
    >
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
          {/* Value labels on each bar so the occupancy band is readable
              without relying on the bar colour alone (WCAG 1.4.1). */}
          <LabelList
            dataKey="occupancy"
            position="top"
            formatter={(v: unknown) => `${v}%`}
            style={{ fontSize: FONT_SIZE, fill: "var(--highlight-10)" }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
