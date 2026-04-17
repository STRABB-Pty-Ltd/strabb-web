"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 133, 0.08)" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#1E1E85" }} tickFormatter={formatAUD} />
        <YAxis
          dataKey="channel"
          type="category"
          tick={{ fontSize: 12, fill: "#1E1E85" }}
          width={100}
        />
        <Tooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar
          dataKey="revenue"
          radius={[0, 4, 4, 0]}
          fill="#1E1E85"
          label={{ position: "right", fontSize: 11, formatter: (v) => formatAUD(Number(v)) }}
        />
      </BarChart>
    </ChartContainer>
  );
}
