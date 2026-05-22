import { Role, Status } from "@/types/admin";
import React from "react";
import ModalShell from "../ui/ModalShell";
import UserFormFields from "./UserFormFields";
import { useTranslation } from "react-i18next";
export default function AddEditUserModal({
  mode,
  open,
  title,
  subtitle,
  form,
  setForm,
  onClose,
  onSubmit,
  submitLabel,
  loading,
}: {
  mode: "add" | "edit";
  open: boolean;
  title: string;
  subtitle?: string;
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
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const isAddValid =
    mode === "add"
      ? form.name.trim() && form.email.trim() && (form.password ?? "").length >= 6
      : form.name.trim() && form.email.trim();
  return (
    <ModalShell open={open} title={title} subtitle={subtitle} onClose={onClose}>
      <UserFormFields form={form} setForm={setForm} mode={mode} />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-[12px] font-extrabold transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          {t('admin.users.cancel', 'Cancel')}
        </button>
        <button
          className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold disabled:opacity-50"
          onClick={onSubmit}
          disabled={!isAddValid || loading}
        >
          {loading ? t('admin.users.saving', 'Saving...') : submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}
