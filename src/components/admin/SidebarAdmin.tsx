import React from "react";
import { LayoutDashboard, Settings, Users, BarChart3 } from "lucide-react";

import SideItem from "./SideItem";
import { NavKey } from "@/types/admin";

export default function Sidebar({
  nav,
  setNav,
}: {
  nav: NavKey;
  setNav: (k: NavKey) => void;
}) {
  return (
    <aside className="w-[240px] border-r border-slate-100 min-h-screen bg-white relative">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">AI</span>
          </div>
          <div>
            <div className="text-[13px] font-extrabold leading-4">
              AI Doctor
            </div>
            <div className="text-[10px] text-slate-400">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="px-4 mt-6 space-y-1">
        <SideItem
          icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
          label="Dashboard"
          active={nav === "dashboard"}
          onClick={() => setNav("dashboard")}
        />
        <SideItem
          icon={<Users className="w-[18px] h-[18px]" />}
          label="User Management"
          active={nav === "users"}
          onClick={() => setNav("users")}
        />
        <SideItem
          icon={<BarChart3 className="w-[18px] h-[18px]" />}
          label="Analytics"
          active={nav === "analytics"}
          onClick={() => setNav("analytics")}
        />
        <SideItem
          icon={<Settings className="w-[18px] h-[18px]" />}
          label="Settings"
          active={nav === "settings"}
          onClick={() => setNav("settings")}
        />
      </nav>

      <div className="absolute bottom-0 left-0 w-[240px] p-4">
        <button className="w-full text-left text-[12px] text-slate-500 hover:text-slate-700">
          Help Center
        </button>
      </div>
    </aside>
  );
}
