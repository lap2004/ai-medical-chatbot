import { clsx } from "@/types/admin";
import React from "react";
export default function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green";
}) {
  const toneCls =
    tone === "blue"
      ? "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
        : "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        toneCls,
      )}
    >
      {children}
    </span>
  );
}
