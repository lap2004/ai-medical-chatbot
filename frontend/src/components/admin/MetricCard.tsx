import React from "react";
export default function MetricCard({
  title,
  value,
  delta,
}: {
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
        {title}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-[22px] font-black text-slate-900">{value}</div>
        <div className="text-[11px] font-extrabold text-emerald-500">
          {delta}
        </div>
      </div>
    </div>
  );
}
