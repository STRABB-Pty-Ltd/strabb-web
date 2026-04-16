"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer } from "./chart-container";

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
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="listing"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAUD} />
        <Tooltip
          formatter={(value) => [formatAUD(Number(value)), "Revenue"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
