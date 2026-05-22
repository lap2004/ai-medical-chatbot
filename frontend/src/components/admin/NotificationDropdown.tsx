import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotificationStore, NotificationType, AppNotification } from "@/store/notificationStore";

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "info": return <Info className="w-5 h-5 text-blue-500" />;
    default: return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    deleteNotification
  } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-950"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">
                {t('admin.topbar.notifications', 'Notifications')}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={clearAll}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400">No notifications yet</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">When you get notifications, they'll show up here.</div>
              </div>
            ) : (
              notifications.map((notif: AppNotification) => (
                <div 
                  key={notif.id}
                  className={`relative group p-3 rounded-xl transition-colors cursor-default
                    ${notif.read 
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                      : 'bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                    }
                  `}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="flex justify-between items-start gap-2 mb-0.5">
                        <div className={`text-[13px] font-bold ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </div>
                        <div className="text-[10px] whitespace-nowrap text-slate-400 mt-0.5">
                          {formatTimeAgo(notif.createdAt)}
                        </div>
                      </div>
                      <div className={`text-[12px] ${notif.read ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notif.message}
                      </div>
                    </div>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.read && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700 transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 transition-all ml-1"
                      title="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-md bg-teal-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
