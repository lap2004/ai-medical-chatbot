import React from "react";
import { Bell } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

export default function Topbar({
  onLogout,
  userInfo,
  onChangePassword,
}: {
  onLogout: () => void;
  userInfo?: any;
  onChangePassword: () => void;
}) {
  return (
    <header className="h-14 border-b border-slate-100 px-7 flex items-center justify-between bg-white">
      <div className="text-[14px] font-extrabold">User Management</div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-slate-50">
          <Bell className="w-5 h-5 text-slate-400" />
        </button>

        <ProfileDropdown
          onLogout={onLogout}
          userInfo={userInfo}
          onChangePassword={onChangePassword}
        />
      </div>
    </header>
  );
}
