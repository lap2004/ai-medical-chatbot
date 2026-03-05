import React from "react";
import { Download, Filter, Plus, Search } from "lucide-react";
import { Role, Status } from "@/types/admin";

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
          placeholder="Search users by name, email or ID..."
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Filter */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-bold flex items-center gap-2"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter className="w-4 h-4 text-slate-400" />
            Filter
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-[240px] rounded-2xl border border-slate-100 bg-white shadow-xl p-3 z-50">
              <div className="text-[11px] font-extrabold text-slate-700 mb-2">
                Filters
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    Role
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 px-2 text-[12px] font-semibold"
                  >
                    <option value="ALL">All</option>
                    <option value="ADMIN">Admin</option>
                    <option value="USER">User</option>
                  </select>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    Status
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      onStatusFilterChange(e.target.value as any)
                    }
                    className="w-full h-9 rounded-xl border border-slate-200 px-2 text-[12px] font-semibold"
                  >
                    <option value="ALL">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <button
                  className="w-full h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
                  onClick={onReset}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button
          className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-bold flex items-center gap-2"
          onClick={onExport}
          title="Export CSV"
        >
          <Download className="w-4 h-4 text-slate-400" />
          Export CSV
        </button>

        {/* Add */}
        <button
          className="h-10 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold flex items-center gap-2"
          onClick={onOpenAdd}
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>
    </div>
  );
}
