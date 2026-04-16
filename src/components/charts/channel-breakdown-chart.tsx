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

const channelColors: Record<string, string> = {
  Airbnb: "#FF5A5F",
  "Booking.com": "#003580",
  VRBO: "#3B5998",
  Direct: "#D97706",
};

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
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatAUD} />
        <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} width={100} />
        <Tooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar
          dataKey="revenue"
          radius={[0, 4, 4, 0]}
          fill="#3B82F6"
          label={{ position: "right", fontSize: 11, formatter: (v) => formatAUD(Number(v)) }}
        >
          {data.map((entry, i) => (
            <rect key={i} fill={channelColors[entry.channel] ?? entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
