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
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-extrabold">
            User Growth (30 Days)
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Overview of new user acquisition over the past month
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-extrabold text-teal-600">12,840</div>
          <div className="text-[10px] text-slate-400">+25.3% prev month</div>
        </div>
      </div>

      <div className="mt-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis dataKey="w" tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
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
