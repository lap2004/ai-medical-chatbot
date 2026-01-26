import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/Button";
import { useUserSignup } from "@/services/hooks/hookAuth";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { postUserSignup } = useUserSignup();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange =
    (key: "full_name" | "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const validate = () => {
    if (!form.full_name.trim()) {
      toast.warning("Vui lòng nhập họ và tên.");
      return false;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.warning("Vui lòng nhập email hợp lệ.");
      return false;
    }
    if (!form.password || form.password.length < 8) {
      toast.warning("Mật khẩu phải có ít nhất 8 ký tự.");
      return false;
    }
    if (!form.agree) {
      toast.warning("Vui lòng đồng ý Terms & Privacy Policy.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[Signup] click", form);
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      await postUserSignup({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        role: "student",
        password: form.password,
      });

      toast.success("Đăng ký tài khoản thành công.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail || "Lỗi đăng ký. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-between p-16 bg-primary relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center space-x-2 text-white mb-12">
              <span className="material-icons-round text-3xl">
                medical_services
              </span>
              <span className="text-2xl font-bold">HealthAI</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-8">
              Your Personal Health Companion, Reimagined.
            </h1>
            <p className="text-teal-50 text-xl opacity-90 leading-relaxed">
              Join thousands of users getting reliable medical guidance, symptom
              checks, and medication support instantly.
            </p>
          </div>

          <div className="z-10 bg-white/10 p-6 rounded-3xl border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <span className="material-icons-round">verified_user</span>
              </div>
              <div>
                <p className="font-bold text-white">HIPAA Compliant</p>
                <p className="text-teal-50 text-sm opacity-80">
                  Your medical data is encrypted and secure.
                </p>
              </div>
            </div>
          </div>

          {/* Decorations */}
          <div className="absolute top-20 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Right Side */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Create Account
            </h2>
            <p className="text-slate-500">
              Start your journey to better health today.
            </p>
          </div>

          {/* ✅ chỉ thêm onSubmit + value/onChange/disabled (UI giữ nguyên) */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. John Doe"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
                value={form.full_name}
                onChange={handleChange("full_name")}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
                value={form.email}
                onChange={handleChange("email")}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
                value={form.password}
                onChange={handleChange("password")}
                disabled={loading}
              />
              <p className="mt-2 text-[10px] text-slate-400 px-1">
                At least 8 characters with a mix of letters and numbers.
              </p>
            </div>

            <div className="flex items-start space-x-3 py-2">
              <input
                type="checkbox"
                className="mt-1 rounded text-primary focus:ring-primary w-5 h-5 border-slate-200"
                checked={form.agree}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, agree: e.target.checked }))
                }
                disabled={loading}
              />
              <label className="text-sm text-slate-500">
                I agree to the{" "}
                <a href="#" className="font-bold text-primary">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="font-bold text-primary">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <Button
              className="w-full py-4 text-lg"
              type="submit"
              disabled={loading}
              onClick={handleSubmit as any}
            >
              {loading ? "Creating..." : "Create Account"}
              <span className="material-icons-round ml-2">arrow_forward</span>
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 font-medium">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-bold text-secondary hover:underline"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
