import React from "react";

import Topbar from "./Topbar";
import { NavKey } from "@/types/admin";
import Sidebar from "./SidebarAdmin";

import { useUserMe } from "@/services/hooks/hookAuth";

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
  const { getuserMe } = useUserMe();
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [openReset, setOpenReset] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    getuserMe().then((data) => {
      if (data) setUserInfo(data);
    });
  }, []);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex">
        <Sidebar nav={nav} setNav={setNav} />
        <main className="flex-1">
          <Topbar
            onLogout={onLogout}
            userInfo={userInfo}
            onChangePassword={() => setOpenReset(true)}
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
