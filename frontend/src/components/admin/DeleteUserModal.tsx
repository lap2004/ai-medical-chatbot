import React from "react";
import ModalShell from "../ui/ModalShell";
import { useTranslation } from "react-i18next";

export default function DeleteUserModal({
  open,
  name,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ModalShell
      open={open}
      title={t('admin.users.deleteUser', 'Delete user?')}
      subtitle={
        name
          ? t('admin.users.deleteUserDesc', { name, defaultValue: `This will permanently delete ${name}. You can't undo this action.` })
          : t('admin.users.deleteActionCantUndo', "This action can't be undone.")
      }
      onClose={onClose}
    >
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-[12px] font-extrabold transition-colors"
          onClick={onClose}
        >
          {t('admin.users.cancel', 'Cancel')}
        </button>
        <button
          className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-extrabold"
          onClick={onConfirm}
        >
          {t('admin.users.delete', 'Delete')}
        </button>
      </div>
    </ModalShell>
  );
}
