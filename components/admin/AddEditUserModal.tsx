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
}: {
  mode: "add" | "edit";
  open: boolean;
  title: string;
  subtitle?: string;

  form: { name: string; email: string; role: Role; status: Status };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      role: Role;
      status: Status;
    }>
  >;

  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <ModalShell open={open} title={title} subtitle={subtitle} onClose={onClose}>
      <UserFormFields form={form} setForm={setForm} />

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold"
          onClick={onSubmit}
          disabled={!form.name.trim() || !form.email.trim()}
        >
          {submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}
