import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Mail, Lock, Stethoscope, Apple, Eye, EyeOff } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/Button";
import { SocialButton } from "@/components/ui/SocialButton";
import { TextInput } from "@/components/ui/TextInput";

import { useUserLogin, useUserGoogleLogin } from "@/services/hooks/hookAuth";
import { setAuthCookies } from "@/lib/helper/token";
import { ROLE_VALUE } from "@/services/config/const";
import { useAuthUIStore } from "@/store";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { postUserLogin } = useUserLogin();
  const { postUserGoogleLogin } = useUserGoogleLogin();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setForcePasswordChange = useAuthUIStore(
    (s) => s.setForcePasswordChange,
  );

  const handleChange =
    (key: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const validate = () => {
    if (!form.email.trim()) {
      toast.error(t('login.pleaseEnterEmail', 'Please enter your email.'));
      return false;
    }
    if (!form.password) {
      toast.error(t('login.pleaseEnterPassword', 'Please enter your password.'));
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

      if (!data?.access_token) {
        toast.error(data?.detail || t('login.loginFailed', 'Login failed!'));
        return;
      }

      // ✅ Lưu token
      setAuthCookies(data.access_token, data.refresh_token);

      // ✅ Lưu role
      if (data?.role) {
        Cookies.set(ROLE_VALUE, data.role);
      }

      // ✅ Force đổi mật khẩu
      if (data?.force_password_change === true) {
        toast.info(t('login.tempPasswordNotice', 'You are using a temporary password. Please change it.'));
        setForcePasswordChange(true);

        // ✅ Đi vào hệ thống; popup sẽ mở ở Home/Admin
        navigate(data.role === "admin" ? "/dashboard" : "/", {
          replace: true,
        });
        return;
      }

      // ✅ Login bình thường
      toast.success(t('login.loginSuccess', 'Login successful!'));
      setForcePasswordChange(false); // (khuyến nghị) clear flag nếu trước đó còn

      navigate(data.role === "admin" ? "/dashboard" : "/", {
        replace: true,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('login.loginFailed', 'Login failed!'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    try {
      // Backend expects {id_token: token} but useGoogleLogin gives access_token in implicit flow.
      // If the backend is designed for Google Sign-In (Official), it might expect id_token.
      // However, typical SPA integrations with access_token are also common.
      // Sending access_token to postUserGoogleLogin which then sends it as id_token to backend.
      const res = await postUserGoogleLogin(tokenResponse.access_token);
      const data = res?.data;

      if (!data?.access_token) {
        toast.error(data?.detail || t('login.googleLoginFailed', 'Google login failed!'));
        return;
      }

      setAuthCookies(data.access_token, data.refresh_token);
      if (data?.role) {
        Cookies.set(ROLE_VALUE, data.role);
      }

      toast.success(t('login.googleLoginSuccess', 'Google login successful!'));
      navigate(data.role === "admin" ? "/dashboard" : "/", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('login.googleLoginFailed', 'Google login failed!'));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => toast.error("Google Login Failed"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-end absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary mb-4 shadow-primary/20 text-white">
            <Stethoscope className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('login.welcomeBack', 'Welcome Back')}
          </h1>
          <p className="text-slate-500 mt-2">
            {t('login.accessAssistant', 'Access your personal health assistant')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-[32px] p-8">
          <form className="space-y-6" onSubmit={onSubmit}>
            <TextInput
              label={t('login.emailAddress', 'Email Address')}
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
                  {t('login.password', 'Password')}
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() => navigate("/forgot-password")}
                  disabled={isLoading}
                >
                  {t('login.forgot', 'Forgot?')}
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full !rounded-2xl !py-4"
              disabled={isLoading}
            >
              {isLoading ? t('login.signingIn', 'Signing In...') : t('login.signIn', 'Sign In')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">
                {t('login.orContinueWith', 'Or continue with')}
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
              onClick={() => loginWithGoogle()}
            />

            <SocialButton
              label="Apple"
              icon={<Apple className="w-5 h-5" />}
              onClick={() => toast.info(t('login.appleLoginNotIntegrated', 'Apple login is not integrated yet.'))}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-slate-500">
          {t('login.dontHaveAccount', "Don't have an account?")}{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-bold text-secondary hover:underline"
          >
            {t('login.signUpForFree', 'Sign up for free')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
