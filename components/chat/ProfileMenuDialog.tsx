import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onChangePassword?: () => void;
  anchorRef: React.RefObject<HTMLElement>;
};

export const ProfileMenuDialog: React.FC<Props> = ({
  open,
  onClose,
  onSignOut,
  onChangePassword,
  anchorRef,
}) => {
  const GAP = 10;
  const EDGE = 12;
  const PANEL_W = 320;

  const panelRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Compute vị trí theo anchor (viewport)
  useLayoutEffect(() => {
    if (!open) return;

    const compute = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const r = anchor.getBoundingClientRect();

      // đo height thật (để flip lên nếu cần)
      const ph = Math.max(200, panel.getBoundingClientRect().height || 0);
      const pw = PANEL_W;

      // căn phải theo anchor
      let left = r.right - pw;
      let top = r.bottom + GAP;

      // nếu thiếu chỗ dưới -> flip lên trên
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      if (spaceBelow < ph + GAP && spaceAbove > spaceBelow) {
        top = r.top - ph - GAP;
      }

      // clamp không tràn viewport
      left = Math.max(EDGE, Math.min(left, window.innerWidth - pw - EDGE));
      top = Math.max(EDGE, Math.min(top, window.innerHeight - ph - EDGE));

      setPos({ left, top });
    };

    // chạy ngay + chạy lại 1 frame để chắc panel đo được size
    compute();
    const raf = requestAnimationFrame(compute);

    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  // ✅ Portal ra body để KHÔNG bị cắt bởi overflow/transform của layout
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed w-[320px] rounded-[28px] bg-white shadow-2xl border border-slate-200/70 overflow-hidden"
        style={
          pos ? { left: pos.left, top: pos.top } : { right: EDGE, top: 72 } // fallback
        }
      >
        <div className="p-6">
          {/* Top row: close */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Close"
              title="Close"
            >
              <span className="material-icons-round text-[18px]">close</span>
            </button>
          </div>

          {/* Profile */}
          <div className="-mt-2 flex flex-col items-center text-center">
            <div className="relative">
              <img
                src="https://picsum.photos/seed/alex/120/120"
                alt="Alex Johnson"
                className="w-[84px] h-[84px] rounded-full object-cover ring-4 ring-white shadow-md"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-extrabold tracking-wide rounded-full bg-primary text-white shadow">
                PREMIUM
              </span>
            </div>

            <div className="mt-4">
              <div className="text-[18px] font-extrabold text-slate-900 leading-tight">
                Alex Johnson
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                alex.j@example.com
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
              <span className="material-icons-round text-[14px]">badge</span>
              Patient ID: #PA-99201
            </div>
          </div>

          <div className="my-5 h-px bg-slate-100" />

          <button
            onClick={() => {
              onChangePassword?.();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <span className="material-icons-round text-[18px]">
                  lock_reset
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Change Password
              </div>
            </div>
            <span className="material-icons-round text-slate-300">
              chevron_right
            </span>
          </button>

          <button
            onClick={onSignOut}
            className="mt-4 w-full rounded-2xl py-3 bg-red-50 text-red-600 font-extrabold hover:bg-red-100 active:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
