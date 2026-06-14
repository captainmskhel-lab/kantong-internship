"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { rupiah, rupiahShort } from "@/lib/money";

export function IncomeExpenseChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71717A" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#71717A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 10, fill: "#A1A1AA" }}
            tickFormatter={(v) => rupiahShort(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: "#E4E4E7" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #E4E4E7",
              fontSize: 12,
              boxShadow: "0 8px 24px -12px rgba(24,24,27,0.18)",
            }}
            formatter={(value: number, name) => [rupiah(value), name === "income" ? "Pemasukan" : "Pengeluaran"]}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#DC2626"
            strokeWidth={2.5}
            fill="url(#grad-income)"
            animationDuration={700}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#A1A1AA"
            strokeWidth={2}
            fill="url(#grad-expense)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
