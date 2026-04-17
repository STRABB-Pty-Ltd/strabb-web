"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";

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
  if (rate < 80) return "var(--brand-10)";
  return "var(--status-success)";
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  return (
    <ChartContainer title="Occupancy by Listing" loading={loading} empty={data.length === 0}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 133, 0.08)" />
        <XAxis
          dataKey="listing"
          tick={{ fontSize: 13, fill: "var(--brand-10)" }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={55}
        />
        <YAxis
          tick={{ fontSize: 13, fill: "var(--brand-10)" }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Occupancy"]}
          contentStyle={{ fontSize: 13 }}
        />
        <Bar dataKey="occupancy" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getOccupancyColor(entry.occupancy)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
