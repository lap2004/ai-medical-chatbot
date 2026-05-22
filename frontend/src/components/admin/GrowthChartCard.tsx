import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function GrowthChartCard({
  data,
}: {
  data: Array<{ w: string; v: number }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-extrabold text-slate-900 dark:text-white">
            User Growth (30 Days)
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Overview of new user acquisition over the past month
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-extrabold text-teal-600 dark:text-teal-400">12,840</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">+25.3% prev month</div>
        </div>
      </div>

      <div className="mt-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#475569" className="opacity-30 dark:opacity-50" />
            <XAxis dataKey="w" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
