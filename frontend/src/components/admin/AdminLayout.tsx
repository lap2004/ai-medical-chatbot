import React from "react";

import Topbar from "./Topbar";
import { NavKey } from "@/types/admin";
import Sidebar from "./SidebarAdmin";

import { useUserStore } from "@/store/userStore";

import { ResetPasswordDialog } from "@/components/auth/ResetPasswordDialog";
import { useNavigate } from "react-router-dom";

export default function AdminLayout({
  nav,
  setNav,
  onLogout,
  children,
}: {
  nav: NavKey;
  setNav: (k: NavKey) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const { userInfo, fetchUserInfo, updateAvatarUrl } = useUserStore();
  const [openReset, setOpenReset] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="flex">
        <Sidebar nav={nav} setNav={setNav} />
        <main className="flex-1">
          <Topbar
            onLogout={onLogout}
            userInfo={userInfo}
            onChangePassword={() => setOpenReset(true)}
            onAvatarChange={updateAvatarUrl}
          />
          {children}
        </main>
      </div>
      <ResetPasswordDialog
        open={openReset}
        onClose={() => setOpenReset(false)}
        onSuccess={() => navigate("/login", { replace: true })}
      />
    </div>
  );
}
