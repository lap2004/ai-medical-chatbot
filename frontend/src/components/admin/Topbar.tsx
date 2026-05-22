import React from "react";
import { Bell, Moon, Sun } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";
export default function Topbar({
  onLogout,
  userInfo,
  onChangePassword,
  onAvatarChange,
}: {
  onLogout: () => void;
  userInfo?: any;
  onChangePassword: () => void;
  onAvatarChange?: (newUrl: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b border-slate-100 dark:border-slate-800 px-7 flex items-center justify-between bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="text-[14px] font-extrabold text-slate-900 dark:text-white">{t('admin.userManagement', 'User Management')}</div>
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <LanguageSwitcher />
        {/* Dark Mode Toggle */}
        <button
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={() => document.documentElement.classList.toggle('dark')}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          <Moon className="w-5 h-5 dark:hidden text-slate-500" />
          <Sun className="w-5 h-5 hidden dark:block text-slate-300" />
        </button>
        <ProfileDropdown
          onLogout={onLogout}
          userInfo={userInfo}
          onChangePassword={onChangePassword}
          onAvatarChange={onAvatarChange}
        />
      </div>
    </header>
  );
}
