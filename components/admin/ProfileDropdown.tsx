import React from "react";
import { ChevronDown, X, LogOut, KeyRound, Shield } from "lucide-react";

export default function ProfileDropdown({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden" />
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[320px] rounded-[28px] bg-white border border-slate-100 shadow-2xl p-5 z-50">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 p-2 rounded-xl hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex flex-col items-center pt-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-600 text-white">
                ADMIN
              </div>
            </div>

            <div className="mt-4 text-[18px] font-black text-slate-900">
              Alex Johnson
            </div>
            <div className="text-[12px] text-slate-400 -mt-0.5">
              alex.j@example.com
            </div>

            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              <Shield className="w-4 h-4" />
              <span className="text-[11px] font-extrabold">
                Admin ID: #AD-99201
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-slate-100" />

          <button
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              // TODO: route / modal change password
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-[13px] font-extrabold text-slate-700">
                Change Password
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
          </button>

          <button
            className="mt-4 w-full h-11 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[13px] flex items-center justify-center gap-2"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut className="w-4 h-4" />
            Back to Home Page
          </button>
        </div>
      )}
    </div>
  );
}
