import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useUserForgotPassword } from "@/services/hooks/hookAuth";
const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const { postUserForgotPassword } = useUserForgotPassword();
  const validate = () => {
    if (!trimmedEmail) {
      toast.error("Vui lòng nhập email.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error("Email không hợp lệ.");
      return false;
    }
    return true;
  };
  const handleSend = async () => {
    if (isLoading) return;
    if (!validate()) return;
    setIsLoading(true);
    try {
      await postUserForgotPassword({ email: trimmedEmail });
      toast.success(
        "Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra email.",
      );
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-slate-50 to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary mb-4 shadow-primary/20 text-white">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Forgot Password?
          </h1>
          <p className="text-slate-500 mt-2">
            Enter your email address to receive a password reset link.
          </p>
        </div>
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-[32px] p-8">
          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800/10 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Link đặt lại mật khẩu đã được gửi.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Hãy kiểm tra inbox (và cả spam). Mở email và bấm vào link để
                  tới trang Reset Password.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                variant="primary"
                size="lg"
                className="w-full !rounded-2xl !py-4 !bg-emerald-800 hover:!bg-emerald-900"
              >
                Back to Login
              </Button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                }}
                className="w-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Gửi lại email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <TextInput
                label="Email Address"
                type="email"
                placeholder="name@gmail.com"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleSend}
                variant="primary"
                size="lg"
                className="w-full !rounded-2xl !py-4"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="relative pt-2">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          )}
        </div>
        <p className="text-center mt-8 text-xs text-slate-400">
          Need help? Contact our support team or read our Security Guide.
        </p>
        <p className="text-center mt-3 text-[10px] text-slate-300 tracking-widest">
          SECURE BY <span className="font-semibold">MediaAI</span>
        </p>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
