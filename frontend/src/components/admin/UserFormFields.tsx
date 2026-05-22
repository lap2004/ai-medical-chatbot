import { Role, Status } from "@/types/admin";
import React from "react";
import { useTranslation } from "react-i18next";
export default function UserFormFields({
  form,
  setForm,
  mode,
}: {
  form: { name: string; email: string; password?: string; role: Role; status: Status };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      password?: string;
      role: Role;
      status: Status;
    }>
  >;
  mode: "add" | "edit";
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
          {t('admin.users.nameLabel', 'Name')}
        </div>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 text-[12px] font-semibold transition-colors"
          placeholder={t('admin.users.fullNamePlaceholder', 'Full name')}
        />
      </div>
      <div>
        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
          {t('admin.users.email', 'Email')}
        </div>
        <input
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 text-[12px] font-semibold transition-colors"
          placeholder={t('admin.users.emailPlaceholder', 'email@example.com')}
          type="email"
        />
      </div>
      {mode === "add" && (
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {t('admin.users.passwordLabel', 'Password')}
          </div>
          <input
            value={form.password ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 text-[12px] font-semibold transition-colors"
            placeholder={t('admin.users.passwordPlaceholder', 'Minimum 6 characters')}
            type="password"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {t('admin.users.role', 'Role')}
          </div>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((p) => ({ ...p, role: e.target.value as Role }))
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[12px] font-semibold transition-colors"
          >
            <option value="ADMIN">{t('admin.users.admin', 'Admin')}</option>
            <option value="USER">{t('admin.users.user', 'User')}</option>
          </select>
        </div>
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            {t('admin.users.status', 'Status')}
          </div>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((p) => ({ ...p, status: e.target.value as Status }))
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[12px] font-semibold transition-colors"
          >
            <option value="Active">{t('admin.users.active', 'Active')}</option>
            <option value="Inactive">{t('admin.users.inactive', 'Inactive')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
