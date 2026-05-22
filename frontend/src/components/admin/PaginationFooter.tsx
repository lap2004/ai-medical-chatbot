import { clsx } from "@/types/admin";
import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }).map(
    (_, idx) => idx + 1,
  );

  return (
    <div className="mt-3 px-1 pb-3 flex items-center justify-between">
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
        {t('admin.users.showing', 'Showing')} <span className="text-slate-600 dark:text-slate-300">{from}</span> {t('admin.users.to', 'to')}{" "}
        <span className="text-slate-600 dark:text-slate-300">{to}</span> {t('admin.users.of', 'of')}{" "}
        <span className="text-slate-600 dark:text-slate-300">{totalItems}</span> {t('admin.users.users', 'users')}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-[12px] font-extrabold transition-colors"
          disabled={page <= 1}
          onClick={onPrev}
        >
          {t('admin.users.previous', 'Previous')}
        </button>

        <div className="flex items-center gap-1">
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => onGoToPage(p)}
              className={clsx(
                "w-9 h-9 rounded-xl text-[12px] font-extrabold transition-colors",
                p === page
                  ? "bg-teal-500 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-[12px] font-extrabold transition-colors"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          {t('admin.users.next', 'Next')}
        </button>
      </div>
    </div>
  );
}
