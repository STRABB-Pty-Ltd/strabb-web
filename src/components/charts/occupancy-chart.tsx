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
  if (rate < 50) return "#DC2626";
  if (rate < 80) return "#D97706";
  return "#16A34A";
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  return (
    <ChartContainer title="Occupancy by Listing" loading={loading} empty={data.length === 0}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="listing"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          formatter={(value) => [`${value}%`, "Occupancy"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getOccupancyColor(entry.occupancy)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
