import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, RotateCcw, Lock, CheckCircle2 } from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useUserResetPassword } from "@/services/hooks/hookAuth";

// NOTE: hàm này đang dùng để hiển thị + validate theo hint UI
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
    level >= 4 ? "STRONG" : level === 3 ? "GOOD" : level === 2 ? "FAIR" : "WEAK";

  // hint “numbers and symbols” => bắt buộc cả 2
  const passed = hasMinLen && hasNumber && hasSymbol;

  return { level, label, passed };
}

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ Change password yêu cầu user đang login
  const accessToken = Cookies.get("access_token");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [show0, setShow0] = useState(false);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { postUserResetPassword } = useUserResetPassword();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = () => {
    if (!accessToken) {
      toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để đổi mật khẩu.");
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

      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("ROLE_VALUE");

      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || "Đổi mật khẩu thất bại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-slate-50 to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary mb-4 shadow-xl shadow-primary/20 text-white">
            <RotateCcw className="w-7 h-7" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4">
            Change Password
          </h1>
          <p className="text-slate-500 mt-2">
            Secure your AI Doctor Assistant account
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 shadow-2xl rounded-[32px] p-8">
          <div className="space-y-5">
            {/* ✅ Current password (THIẾU trong bản cũ) */}
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
                  {show0 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className={`font-bold ${strength.label === "STRONG"
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
                      className={`h-2 w-full rounded-full transition-colors ${filled ? "bg-emerald-800" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-[12px]">
                <CheckCircle2
                  className={`w-4 h-4 ${strength.passed
                    ? "text-emerald-800"
                    : "text-slate-300 dark:text-slate-700"
                    }`}
                />
                <span className={strength.passed ? "text-slate-500" : "text-slate-400"}>
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
                  {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-slate-300 tracking-widest">
          SECURE BY <span className="font-semibold">MediaAI</span>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
