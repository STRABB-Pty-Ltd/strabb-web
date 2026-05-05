"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";
import { ChartTooltip } from "./chart-tooltip";

// Recharts forwards numeric font sizes to internal SVG <text> elements and uses
// getComputedStyle for measurement, so a `var(--text-body)` string is unsafe in
// these props. Mirror the token here as a plain number to keep the link
// documented while staying compatible.
const FONT_SIZE = 13; // mirrors var(--text-body)

interface ChannelData {
  channel: string;
  revenue: number;
  percentage: number;
  color: string;
}

interface ChannelBreakdownChartProps {
  data: ChannelData[];
  loading?: boolean;
}

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export function ChannelBreakdownChart({ data, loading }: ChannelBreakdownChartProps) {
  return (
    <ChartContainer title="Channel Breakdown" loading={loading} empty={data.length === 0}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          tick={{ fontSize: FONT_SIZE, fill: "var(--brand-10)" }}
          tickFormatter={formatAUD}
        />
        <YAxis
          dataKey="channel"
          type="category"
          tick={{ fontSize: FONT_SIZE, fill: "var(--brand-10)" }}
          // 89 is on the Fibonacci ladder
          width={89}
        />
        <ChartTooltip formatter={(value) => [formatAUD(Number(value)), "Revenue"]} />
        <Bar
          dataKey="revenue"
          radius={[0, 3, 3, 0]}
          label={{
            position: "right",
            fontSize: FONT_SIZE,
            formatter: (v) => formatAUD(Number(v)),
          }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
