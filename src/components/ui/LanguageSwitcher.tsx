import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";
  const vnFlag = "https://flagcdn.com/w40/vn.png";
  const usFlag = "https://flagcdn.com/w40/us.png";
  const currentFlag = currentLang === "vi" ? vnFlag : usFlag;

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        title={currentLang === "vi" ? "Đổi ngôn ngữ" : "Change language"}
        aria-label="Switch Language"
      >
        <img
          src={currentFlag}
          alt={currentLang === "vi" ? "Vietnam Flag" : "USA Flag"}
          className="w-6 h-4 object-cover shadow-sm"
        />
      </button>

      {isOpen && (
        <div className="absolute right-[-7px] mt-1 w-auto min-w-[3.5rem] p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 flex flex-col items-center gap-1">
          <button
            onClick={() => toggleLanguage('vi')}
            className={`p-2 rounded-lg transition-colors w-full flex justify-center ${currentLang === 'vi' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 hover:rounded-md dark:hover:bg-slate-800'}`}
            title="Tiếng Việt"
          >
            <img src={vnFlag} alt="Vietnam" className="w-6 h-4 object-cover shadow-sm" />
          </button>
          <button
            onClick={() => toggleLanguage('en')}
            className={`p-2 rounded-lg transition-colors w-full flex justify-center ${currentLang === 'en' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 hover:rounded-md dark:hover:bg-slate-800'}`}
            title="English"
          >
            <img src={usFlag} alt="USA" className="w-6 h-4 object-cover shadow-sm" />
          </button>
        </div>
      )}
    </div>
  );
};
