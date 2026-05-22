import React, { useState } from "react";
import { Stethoscope, Moon, Sun, ArrowRight, PlayCircle, BadgeCheck, MessageSquare, Mic, History, MessageCircle, FileEdit, Brain, Lightbulb, Image, Microscope, CheckCircle, Shield } from "lucide-react";
import { Button } from "../components/ui/Button";
import { DoctorWidget } from "../components/widget/DoctorWidget";
import { removeAuthCookies } from "@/lib/helper/token";
import { useNavigate } from "react-router-dom";
import { isLogin, getUserRole } from "../lib/helper";
import { useAuthUIStore } from "@/store";
import { ResetPasswordDialog } from "@/components/auth/ResetPasswordDialog";
import { ProfileMenuDialog } from "@/components/chat/ProfileMenuDialog";
import { useUserStore } from "@/store/userStore";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const navigate = useNavigate();
  const forcePasswordChange = useAuthUIStore((s) => s.forcePasswordChange);
  const [openReset, setOpenReset] = useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileAnchorRef = React.useRef<HTMLButtonElement>(null);
  const { userInfo, fetchUserInfo, updateAvatarUrl } = useUserStore();

  React.useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleLogout = () => {
    try {
      removeAuthCookies();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  React.useEffect(() => {
    if (forcePasswordChange) setOpenReset(true);
  }, [forcePasswordChange]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Doctor AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="/"
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {t('home.nav.home')}
              </a>
              {getUserRole() === "admin" && (
                <a
                  href="/dashboard"
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  {t('home.nav.dashboard')}
                </a>
              )}
              <a
                href="/chat"
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {t('home.nav.chat')}
              </a>
              <a
                href="/support"
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                {t('home.nav.support')}
              </a>
              <LanguageSwitcher />
              <button
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() =>
                  document.documentElement.classList.toggle("dark")
                }
              >
                <Moon className="w-5 h-5 dark:hidden text-slate-600" />
                <Sun className="w-5 h-5 hidden dark:block text-slate-300" />
              </button>
              <button
                ref={profileAnchorRef}
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Open profile menu"
                title="Profile"
              >
                {userInfo?.avatar_url ? (
                  <img
                    alt={userInfo?.full_name || "User"}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    src={`${import.meta.env.VITE_API_BACKEND_DOMAIN || ""}${userInfo.avatar_url}`}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                    {(userInfo?.full_name || "U").charAt(0)}
                  </div>
                )}
                <span className="hidden md:inline text-sm font-bold text-slate-700 dark:text-white truncate max-w-[140px]">
                  {userInfo?.full_name || "Guest"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-teal-50 to-transparent dark:from-teal-900/10 dark:to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary dark:bg-primary/20 font-semibold text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t('home.hero.badge')}
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1]">
                {t('home.hero.title1')}<span className="text-primary">{t('home.hero.title2')}</span>{t('home.hero.title3')}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                {t('home.hero.desc')}
              </p>
              <div className="flex flex-wrap gap-4">
              {/* Nút Get Started */}
              <a href="/chat">
                <Button size="lg" className="px-10">
                  {t('home.hero.getStarted')} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>

              {/* Nút Watch Demo - Bọc thêm thẻ <a> */}
              <a href="/chat">
                <Button variant="outline" size="lg" className="px-10">
                  <PlayCircle className="text-primary mr-2 w-5 h-5" /> {t('home.hero.watchDemo')}
                </Button>
              </a>
            </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden transform rotate-2 z-10 floating">
                <div className="p-6 bg-primary text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://picsum.photos/seed/doc/100/100"
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                      alt=""
                    />
                    <div>
                      <h4 className="font-bold text-sm">Doctor AI</h4>
                      <p className="text-[10px] opacity-70">
                        Medical Assistant
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm">
                    {t('home.widget.title')}
                  </div>
                  <div className="bg-primary/10 p-4 rounded-2xl rounded-tr-none ml-12 text-sm text-primary dark:text-teal-400">
                    {t('home.widget.msg1')}
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm italic opacity-60">
                    {t('home.widget.msg2')}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0"></div>
              <div className="absolute -bottom-10 -left-10 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 z-20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.widget.accuracy')}</p>
                    <p className="text-xl font-bold dark:text-white">96.76%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('home.solutions.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-16 max-w-2xl mx-auto">
            {t('home.solutions.desc')}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: t('home.solutions.instant'),
                desc: t('home.solutions.instantDesc'),
              },
              {
                icon: <Mic className="w-8 h-8" />,
                title: t('home.solutions.voice'),
                desc: t('home.solutions.voiceDesc'),
              },
              {
                icon: <History className="w-8 h-8" />,
                title: t('home.solutions.health'),
                desc: t('home.solutions.healthDesc'),
              },
            ].map((sol, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary transition-all group bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {sol.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                  {sol.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {sol.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      {!isWidgetOpen && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <button
            onClick={() => setIsWidgetOpen(true)}
            className="group flex items-center gap-3
                 bg-primary text-white
                 pl-4 pr-6 py-4
                 rounded-full
                 shadow-primary/40
                 hover:scale-105 transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="font-bold">{t('home.cta.chatWithAi')}</span>
          </button>
        </div>
      )}

      {/* Pop-up Widget */}
      {isWidgetOpen && <DoctorWidget onClose={() => setIsWidgetOpen(false)} />}
      {/* How it Works */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('home.howItWorks.title')}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('home.howItWorks.desc')}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: <FileEdit className="w-6 h-6" />,
                title: t('home.howItWorks.step1'),
                desc: t('home.howItWorks.step1Desc'),
              },
              {
                step: "2",
                icon: <Brain className="w-6 h-6" />,
                title: t('home.howItWorks.step2'),
                desc: t('home.howItWorks.step2Desc'),
              },
              {
                step: "3",
                icon: <Lightbulb className="w-6 h-6" />,
                title: t('home.howItWorks.step3'),
                desc: t('home.howItWorks.step3Desc'),
              },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  {s.icon}
                </div>
                <div className="mt-4 font-bold text-slate-900 dark:text-white">
                  {s.step}. {s.title}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Smart Applications */}
          <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-[#0F766E]/80 to-[#0F766E]/40 p-8 shadow-sm">
                <div className="h-56 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                  {/* Placeholder illustration */}
                  <img
                    className="h-full object-cover"
                    src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80"
                    alt=""
                  />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                    {t('home.smartApps.imgRec')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('home.smartApps.imgRecDesc')}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('home.smartApps.title')}</h3>
              <div className="mt-5 space-y-4">
                {[
                  {
                    icon: <Microscope className="w-5 h-5" />,
                    title: t('home.smartApps.clinImg'),
                    desc: t('home.smartApps.clinImgDesc'),
                  },
                  {
                    icon: <Lightbulb className="w-5 h-5" />,
                    title: t('home.smartApps.medEd'),
                    desc: t('home.smartApps.medEdDesc'),
                  },
                ].map((a) => (
                  <div
                    key={a.title}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                      {a.icon}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {a.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ethics & Privacy */}
          <div className="mt-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <div className="grid lg:grid-cols-[1fr,220px] gap-8 items-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('home.ethics.title')}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {t('home.ethics.desc')}
                </p>

                <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                  {[
                    t('home.ethics.t1'),
                    t('home.ethics.t2'),
                    t('home.ethics.t3'),
                    t('home.ethics.t4'),
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <CheckCircle className="text-[#0F766E] w-[18px] h-[18px]" />
                      <span className="text-slate-700 dark:text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="h-32 w-32 rounded-full bg-[#0F766E]/10 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-[#0F766E] flex items-center justify-center text-white">
                    <Shield className="w-[34px] h-[34px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t('home.cta.title')}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('home.cta.desc')}
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate("/chat")}
                className="h-11 px-7 rounded-full bg-[#2563EB] text-white font-semibold shadow-sm hover:brightness-95 transition"
              >
                {t('home.cta.button')}
              </button>
            </div>
          </div>
        </div>
      </section>
      <ProfileMenuDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        anchorRef={profileAnchorRef}
        userInfo={userInfo}
        onChangePassword={() => setOpenReset(true)}
        onAvatarChange={updateAvatarUrl}
        onSignOut={() => {
          handleLogout();
          setProfileOpen(false);
        }}
      />
      <ResetPasswordDialog
        open={openReset}
        onClose={() => setOpenReset(false)}
        onSuccess={() => navigate("/login", { replace: true })}
      />
    </div>
  );
};

export default HomePage;
