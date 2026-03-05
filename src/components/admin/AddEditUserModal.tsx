import { Role, Status } from "@/types/admin";
import React from "react";
import ModalShell from "../ui/ModalShell";
import UserFormFields from "./UserFormFields";

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
  const isAddValid =
    mode === "add"
      ? form.name.trim() && form.email.trim() && (form.password ?? "").length >= 6
      : form.name.trim() && form.email.trim();

  return (
    <ModalShell open={open} title={title} subtitle={subtitle} onClose={onClose}>
      <UserFormFields form={form} setForm={setForm} mode={mode} />

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold disabled:opacity-50"
          onClick={onSubmit}
          disabled={!isAddValid || loading}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}
