import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Mail, Lock, Stethoscope, Apple, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SocialButton } from "@/components/ui/SocialButton";
import { TextInput } from "@/components/ui/TextInput";

import { useUserLogin } from "@/services/hooks/hookAuth";
import { setAuthCookies } from "@/lib/helper/token";
import { getUserRole } from "@/lib/helper";
import { ROLE_VALUE } from "@/services/config/const";

const LoginPage: React.FC = () => {
  const { postUserLogin } = useUserLogin();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange =
    (key: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const validate = () => {
    if (!form.email.trim()) {
      toast.error("Vui lòng nhập email.");
      return false;
    }
    if (!form.password) {
      toast.error("Vui lòng nhập mật khẩu.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await postUserLogin({
        email: form.email.trim(),
        password: form.password,
      });

      const data = res?.data;
      if (data?.access_token) {
        // Lưu token
        setAuthCookies(data.access_token, data.refresh_token);

        // Lưu role (js-cookie)
        if (data?.role) {
          Cookies.set(ROLE_VALUE, data.role);
        }

        // Force đổi mật khẩu nếu là mật khẩu tạm
        if (data?.force_password_change === true) {
          toast.info(
            "Bạn đang sử dụng mật khẩu tạm thời. Vui lòng đổi mật khẩu.",
          );
          navigate("/reset-password");
          return;
        }

        toast.success("Đăng nhập thành công!");

        // Điều hướng theo role
        const savedRole = getUserRole(); // hoặc dùng data.role luôn
        if (savedRole === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
        return;
      }

      // Không có token => fail
      toast.error(data?.detail || "Đăng nhập thất bại!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Đăng nhập thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary mb-4 shadow-xl shadow-primary/20 text-white">
            <Stethoscope className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-slate-500 mt-2">
            Access your personal health assistant
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 shadow-2xl rounded-[32px] p-8">
          <form className="space-y-6" onSubmit={onSubmit}>
            <TextInput
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              value={form.email}
              onChange={handleChange("email")}
              disabled={isLoading}
            />

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-sm font-semibold dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() => navigate("/forgot-password")}
                  disabled={isLoading}
                >
                  Forgot?
                </button>
              </div>

              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange("password")}
                  disabled={isLoading}
                />

                {/* Toggle show/hide password (nếu TextInput không hỗ trợ rightIcon thì để nút overlay như này) */}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full !rounded-2xl !py-4"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-4">
            <SocialButton
              label="Google"
              icon={
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-5 h-5"
                  alt="Google"
                />
              }
              onClick={() => {
                toast.info("Google login chưa được tích hợp.");
              }}
            />

            <SocialButton
              label="Apple"
              icon={<Apple className="w-5 h-5" />}
              onClick={() => {
                toast.info("Apple login chưa được tích hợp.");
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-bold text-secondary hover:underline"
          >
            Sign up for free
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
