import React from "react";
import { useNavigate } from "react-router-dom";
import { ProfileMenuDialog } from "./ProfileMenuDialog";
import { ResetPasswordDialog } from "../auth/ResetPasswordDialog";
import { removeAuthCookies } from "@/lib/helper/token";
import { Home, MessageSquare, Mic } from "lucide-react";

import { useUserMe } from "@/services/hooks/hookAuth";
import { isLogin } from "@/lib/helper";

type Props = {
  tab: "chat" | "voice";
  onTabChange: (t: "chat" | "voice") => void;
};

export const ChatHeader: React.FC<Props> = ({ tab, onTabChange }) => {
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileAnchorRef = React.useRef<HTMLButtonElement>(null);

  const { getuserMe } = useUserMe();
  const [userInfo, setUserInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (isLogin()) {
      getuserMe().then((data) => {
        if (data) setUserInfo(data);
      });
    }
  }, []);

  const handleLogout = () => {
    try {
      removeAuthCookies();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  return (
    <header className="glass-effect border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/")}
          className="
    w-9 h-9
    flex items-center justify-center
    rounded-xl
    text-slate-500
    hover:text-primary
    hover:bg-primary/5
    transition-all
  "
          title="Back to Home"
          aria-label="Back to Home"
        >
          <Home className="w-6 h-6" />
        </button>

        <div className="relative">
          <img
            alt="Doctor AI"
            className="w-12 h-12 rounded-full border-2 border-primary/20 object-cover"
            src="https://picsum.photos/seed/doctor1/200/200"
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
              Doctor AI
            </h2>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
              ASSISTANT
            </span>
          </div>
          <p className="text-xs text-slate-500">Live Health Guidance</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="inline-flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          {/* Active: Chat */}
          {/* Active: Chat */}
          <button
            type="button"
            onClick={() => onTabChange("chat")}
            className={`
              inline-flex items-center gap-2
              rounded-xl
              px-6 py-2
              text-sm font-bold
              shadow-sm
              transition
              ${tab === "chat"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                : "bg-transparent text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white shadow-none"
              }
            `}
          >
            <MessageSquare
              className={`w-[18px] h-[18px] ${tab === "chat" ? "text-primary" : "opacity-80"
                }`}
            />
            <span>Chat</span>
          </button>

          {/* Tab: Voice */}
          <button
            type="button"
            onClick={() => onTabChange("voice")}
            className={`
              inline-flex items-center gap-2
              rounded-xl
              px-6 py-2
              text-sm font-bold
              transition
              ${tab === "voice"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "bg-transparent text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
              }
            `}
          >
            <Mic
              className={`w-[18px] h-[18px] ${tab === "voice" ? "text-primary" : "opacity-80"
                }`}
            />
            <span>Voice</span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />

        {/* USER TRIGGER (neo dialog ở đây) */}
        <button
          ref={profileAnchorRef}
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 p-2 rounded-2xl hover:bg-primary/5 transition-all"
          aria-label="Open profile menu"
          title="Profile"
        >
          <img
            alt={userInfo?.full_name || "User"}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
            src="https://picsum.photos/seed/alex/100/100"
          />
          <span className="hidden md:inline text-sm font-bold text-slate-700 dark:text-white truncate max-w-[140px]">
            {userInfo?.full_name || "Guest"}
          </span>
        </button>

        {/* PROFILE MENU DIALOG */}
        <ProfileMenuDialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          anchorRef={profileAnchorRef}
          userInfo={userInfo}
          onChangePassword={() => setResetOpen(true)}
          onSignOut={() => {
            handleLogout();
            setProfileOpen(false);
          }}
        />
        <ResetPasswordDialog
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          onSuccess={() => navigate("/login", { replace: true })}
        />
      </div>
    </header >
  );
};
