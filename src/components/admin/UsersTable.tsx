import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../ui/Badge";
import StatusDot from "../ui/StatusDot";
import { UserRow } from "@/types/admin";
import { useTranslation } from "react-i18next";

export default function UsersTable({
  rows,
  onEdit,
  onDelete,
  currentUserId,
}: {
  rows: UserRow[];
  onEdit: (r: UserRow) => void;
  onDelete: (r: UserRow) => void;
  currentUserId?: string | number;
}) {
  const { t } = useTranslation();
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
          <th className="text-left font-extrabold py-3">{t('admin.users.id', 'ID')}</th>
          <th className="text-left font-extrabold py-3">{t('admin.users.user', 'User')}</th>
          <th className="text-left font-extrabold py-3">{t('admin.users.email', 'Email')}</th>
          <th className="text-left font-extrabold py-3">{t('admin.users.role', 'Role')}</th>
          <th className="text-left font-extrabold py-3">{t('admin.users.status', 'Status')}</th>
          <th className="text-left font-extrabold py-3">{t('admin.users.createdDate', 'Created Date')}</th>
          <th className="text-right font-extrabold py-3">{t('admin.users.actions', 'Actions')}</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="py-3 text-slate-500 dark:text-slate-400 font-semibold">{r.id}</td>

            <td className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  {r.avatarUrl ? (
                    <img
                      src={r.avatarUrl}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white">{r.name}</div>
              </div>
            </td>

            <td className="py-3 text-slate-500 dark:text-slate-400 font-semibold">{r.email}</td>

            <td className="py-3">
              <Badge tone={r.role === "ADMIN" ? "blue" : "slate"}>
                {r.role}
              </Badge>
            </td>

            <td className="py-3">
              <StatusDot status={r.status} />
            </td>

            <td className="py-3 text-slate-500 dark:text-slate-400 font-semibold">{r.createdAt}</td>

            <td className="py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  className={`p-2 rounded-lg transition-colors ${r.id === `#${currentUserId}` || r.id === currentUserId?.toString()
                    ? "opacity-50 cursor-not-allowed text-slate-300 dark:text-slate-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  onClick={() => {
                    if (r.id !== `#${currentUserId}` && r.id !== currentUserId?.toString()) {
                      onEdit(r);
                    }
                  }}
                  disabled={r.id === `#${currentUserId}` || r.id === currentUserId?.toString()}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${r.id === `#${currentUserId}` || r.id === currentUserId?.toString()
                    ? "opacity-50 cursor-not-allowed text-slate-300 dark:text-slate-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  onClick={() => {
                    if (r.id !== `#${currentUserId}` && r.id !== currentUserId?.toString()) {
                      onDelete(r);
                    }
                  }}
                  disabled={r.id === `#${currentUserId}` || r.id === currentUserId?.toString()}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}

        {rows.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="py-10 text-center text-[12px] text-slate-400"
            >
              {t('admin.users.noUsersFound', 'No users found.')}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
