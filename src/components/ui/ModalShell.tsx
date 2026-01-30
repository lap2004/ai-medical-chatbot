import React from "react";
import { X } from "lucide-react";

export default function ModalShell({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12px] text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
