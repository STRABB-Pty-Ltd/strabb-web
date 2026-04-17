"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";

interface RevenueTrendData {
  label: string;
  revenue: number;
  bookings?: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  loading?: boolean;
}

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  return (
    <ChartContainer title="Revenue Trend" loading={loading} empty={data.length === 0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand-10)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--brand-10)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 133, 0.08)" />
        <XAxis dataKey="label" tick={{ fontSize: 13, fill: "var(--brand-10)" }} />
        <YAxis tick={{ fontSize: 13, fill: "var(--brand-10)" }} tickFormatter={formatAUD} />
        <Tooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          contentStyle={{ fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--brand-10)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
