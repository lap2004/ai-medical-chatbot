import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle2, X } from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useUserResetPassword } from "@/services/hooks/hookAuth";
import { useAuthUIStore } from "@/store";

function getPasswordStrength(pw: string) {
  const password = pw ?? "";
  const hasMinLen = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let level = 0;
  if (password.length > 0) level = 1;
  if (hasMinLen) level = 2;
  if (hasMinLen && (hasNumber || hasSymbol)) level = 3;
  if (hasMinLen && hasNumber && hasSymbol) level = 4;

  const label =
    level >= 4
      ? "STRONG"
      : level === 3
        ? "GOOD"
        : level === 2
          ? "FAIR"
          : "WEAK";

  const passed = hasMinLen && hasNumber && hasSymbol;
  return { level, label, passed };
}

type ResetPasswordPopupProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;

  /** ✅ true = bắt buộc đổi mật khẩu (UI khác + khóa close) */
  forceChange?: boolean;
};

export const ResetPasswordDialog: React.FC<ResetPasswordPopupProps> = ({
  open,
  onClose,
  onSuccess,
  forceChange = false,
}) => {
  const accessToken = Cookies.get("access_token");
  const { postUserResetPassword } = useUserResetPassword();
  const panelRef = useRef<HTMLDivElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [show0, setShow0] = useState(false);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const forcePasswordChange = useAuthUIStore((s) => s.forcePasswordChange);
  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setShow0(false);
    setShow1(false);
    setShow2(false);
    setIsLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      // ✅ forceChange: không cho ESC close
      if (e.key === "Escape" && !forceChange) onClose();
    };

    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, forceChange]);

  const validate = () => {
    if (!accessToken) {
      toast.error(
        "Bạn chưa đăng nhập. Vui lòng đăng nhập lại để đổi mật khẩu.",
      );
      return false;
    }
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return false;
    }
    if (!password || password.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return false;
    }
    if (!strength.passed) {
      toast.error("Mật khẩu mới cần gồm số và ký tự đặc biệt.");
      return false;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return false;
    }
    if (password === currentPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return false;
    }
    return true;
  };

  const handleReset = async () => {
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    try {
      await postUserResetPassword({
        current_password: currentPassword,
        new_password: password,
      });

      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");

      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Đổi mật khẩu thất bại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999]">
      {/* ✅ Backdrop: forceChange => không đóng */}
      <button
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={() => {
          if (forceChange) return;
          onClose();
        }}
        aria-label="Close"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div
            ref={panelRef}
            tabIndex={-1}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 shadow-2xl rounded-[32px] p-8 outline-none"
            role="dialog"
            aria-modal="true"
          >
            {/* ✅ Header + nút X chỉ hiện khi bình thường */}
            <div className="relative pb-3">
              {/* ✅ TITLE – luôn căn giữa tuyệt đối */}
              {!forcePasswordChange && (
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    absolute top-0 right-0
                    p-1 rounded-xl
                    text-slate-400
                    hover:text-slate-700
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                    transition
                  "
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="text-center space-y-2">
                {forcePasswordChange ? (
                  <>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Password Update Required
                    </h2>
                    <p className="text-sm text-slate-500">
                      For security reasons, you must update your password before
                      continuing.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Change Password
                    </h2>
                    <p className="text-sm text-slate-500">
                      Update your password to keep your account secure.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-5 max-h-[70vh] overflow-auto p-1 pt-3">
              {/* Current password */}
              <div>
                <label className="block text-sm font-semibold dark:text-slate-300 mb-2 ml-1">
                  Current Password
                </label>
                <div className="relative">
                  <TextInput
                    type={show0 ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => setShow0((v) => !v)}
                    disabled={isLoading}
                    aria-label={show0 ? "Hide password" : "Show password"}
                  >
                    {show0 ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-semibold dark:text-slate-300 mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <TextInput
                    type={show1 ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => setShow1((v) => !v)}
                    disabled={isLoading}
                    aria-label={show1 ? "Hide password" : "Show password"}
                  >
                    {show1 ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold tracking-widest">
                    PASSWORD STRENGTH
                  </span>
                  <span
                    className={`font-bold ${
                      strength.label === "STRONG"
                        ? "text-emerald-800"
                        : strength.label === "GOOD"
                          ? "text-emerald-700"
                          : strength.label === "FAIR"
                            ? "text-slate-500"
                            : "text-slate-400"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>

                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const filled = i < strength.level;
                    return (
                      <div
                        key={i}
                        className={`h-2 w-full rounded-full transition-colors ${
                          filled
                            ? "bg-emerald-800"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[12px]">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      strength.passed
                        ? "text-emerald-800"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                  <span
                    className={
                      strength.passed ? "text-slate-500" : "text-slate-400"
                    }
                  >
                    Use at least 8 characters with numbers and symbols
                  </span>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-semibold dark:text-slate-300 mb-2 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <TextInput
                    type={show2 ? "text" : "password"}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => setShow2((v) => !v)}
                    disabled={isLoading}
                    aria-label={show2 ? "Hide password" : "Show password"}
                  >
                    {show2 ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleReset}
                variant="primary"
                size="lg"
                className="w-full !rounded-2xl !py-4"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
