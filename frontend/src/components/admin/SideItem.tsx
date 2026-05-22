import { clsx } from "@/types/admin";
import React from "react";
export default function SideItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full h-10 rounded-xl px-3 flex items-center gap-3 text-[12px] font-extrabold transition-colors",
        active
          ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
      )}
    >
      <span className={clsx(active ? "text-teal-600" : "text-slate-400")}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
