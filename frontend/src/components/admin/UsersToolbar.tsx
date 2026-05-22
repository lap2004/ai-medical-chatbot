import React from "react";
import { Download, Filter, Plus, Search } from "lucide-react";
import { Role, Status } from "@/types/admin";
import { useTranslation } from "react-i18next";

export default function UsersToolbar({
  query,
  onQueryChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
  onExport,
  onOpenAdd,
}: {
  query: string;
  onQueryChange: (v: string) => void;

  roleFilter: Role | "ALL";
  onRoleFilterChange: (v: Role | "ALL") => void;

  statusFilter: Status | "ALL";
  onStatusFilterChange: (v: Status | "ALL") => void;

  onReset: () => void;
  onExport: () => void;
  onOpenAdd: () => void;
}) {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = React.useState(false);

  React.useEffect(() => {
    const onDoc = () => setFilterOpen(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="relative w-[380px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('admin.users.searchUser', 'Search users by name, email or ID...')}
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Filter */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[12px] font-bold flex items-center gap-2 transition-colors"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter className="w-4 h-4 text-slate-400" />
            {t('admin.users.filter', 'Filter')}
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-[240px] rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 z-50 shadow-xl">
              <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-2">
                {t('admin.users.filters', 'Filters')}
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    {t('admin.users.role', 'Role')}
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 text-[12px] font-semibold transition-colors"
                  >
                    <option value="ALL">{t('admin.users.all', 'All')}</option>
                    <option value="ADMIN">{t('admin.users.admin', 'Admin')}</option>
                    <option value="USER">{t('admin.users.user', 'User')}</option>
                  </select>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    {t('admin.users.status', 'Status')}
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      onStatusFilterChange(e.target.value as any)
                    }
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 text-[12px] font-semibold transition-colors"
                  >
                    <option value="ALL">{t('admin.users.all', 'All')}</option>
                    <option value="Active">{t('admin.users.active', 'Active')}</option>
                    <option value="Inactive">{t('admin.users.inactive', 'Inactive')}</option>
                  </select>
                </div>

                <button
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[12px] font-extrabold transition-colors"
                  onClick={onReset}
                >
                  {t('admin.users.reset', 'Reset')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button
          className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[12px] font-bold flex items-center gap-2 transition-colors"
          onClick={onExport}
          title={t('admin.users.exportCsv', 'Export CSV')}
        >
          <Download className="w-4 h-4 text-slate-400" />
          {t('admin.users.exportCsv', 'Export CSV')}
        </button>

        {/* Add */}
        <button
          className="h-10 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold flex items-center gap-2"
          onClick={onOpenAdd}
        >
          <Plus className="w-4 h-4" />
          {t('admin.users.addNewUser', 'Add New User')}
        </button>
      </div>
    </div>
  );
}
