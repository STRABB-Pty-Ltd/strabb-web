"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";

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
          tick={{ fontSize: 13, fill: "var(--brand-10)" }}
          tickFormatter={formatAUD}
        />
        <YAxis
          dataKey="channel"
          type="category"
          tick={{ fontSize: 13, fill: "var(--brand-10)" }}
          width={89}
        />
        <Tooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          contentStyle={{ fontSize: 13 }}
        />
        <Bar
          dataKey="revenue"
          radius={[0, 3, 3, 0]}
          label={{ position: "right", fontSize: 13, formatter: (v) => formatAUD(Number(v)) }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
