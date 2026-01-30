import { Status, clsx } from "@/types/admin";
import React from "react";

export default function StatusDot({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={clsx(
          "w-2 h-2 rounded-full",
          status === "Active" ? "bg-emerald-500" : "bg-slate-300",
        )}
      />
      <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
        {status}
      </span>
    </span>
  );
}
