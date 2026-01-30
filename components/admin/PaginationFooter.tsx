import { clsx } from "@/types/admin";
import React from "react";

export default function PaginationFooter({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPrev,
  onNext,
  onGoToPage,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (p: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }).map(
    (_, idx) => idx + 1,
  );

  return (
    <div className="mt-3 px-1 pb-3 flex items-center justify-between">
      <div className="text-[11px] text-slate-400 font-semibold">
        Showing <span className="text-slate-600">{from}</span> to{" "}
        <span className="text-slate-600">{to}</span> of{" "}
        <span className="text-slate-600">{totalItems}</span> users
      </div>

      <div className="flex items-center gap-2">
        <button
          className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => onGoToPage(p)}
              className={clsx(
                "w-9 h-9 rounded-xl text-[12px] font-extrabold",
                p === page
                  ? "bg-teal-500 text-white"
                  : "border border-slate-200 hover:bg-slate-50",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
