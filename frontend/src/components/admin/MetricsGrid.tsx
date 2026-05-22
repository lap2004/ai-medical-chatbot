import React from "react";
import MetricCard from "./MetricCard";

export default function MetricsGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard title="Total Users" value="12,840" delta="+1.2%" />
      <MetricCard title="New Users Today" value="+142" delta="+12.4%" />
      <MetricCard title="Active Now" value="856" delta="+1.1%" />
      <MetricCard title="Retention Rate" value="94.2%" delta="+0.3%" />
    </div>
  );
}
