import React from "react";
import ModalShell from "../ui/ModalShell";

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
  return (
    <ModalShell
      open={open}
      title="Delete user?"
      subtitle={
        name
          ? `This will permanently delete ${name}. You can’t undo this action.`
          : "This action can’t be undone."
      }
      onClose={onClose}
    >
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-extrabold"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-extrabold"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </ModalShell>
  );
}
