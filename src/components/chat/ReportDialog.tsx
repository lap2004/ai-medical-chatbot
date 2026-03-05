// ReportDialog.tsx
import React, { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string; note?: string }) => void;
};

export const ReportDialog: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const reasons = useMemo(
    () => [
      "Sai thông tin",
      "Nguy hiểm y tế",
      "Nội dung không phù hợp",
      "Spam",
      "Khác",
    ],
    [],
  );
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[92vw] max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Report message
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm outline-none"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm outline-none"
            placeholder="Mô tả thêm (nếu cần)..."
          />
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSubmit({ reason, note: note.trim() || undefined });
              onClose();
            }}
            className="h-10 px-4 rounded-xl bg-primary text-white font-semibold"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
