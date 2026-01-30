import React from "react";

import Topbar from "./Topbar";
import { NavKey } from "@/types/admin";
import Sidebar from "./SidebarAdmin";

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
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex">
        <Sidebar nav={nav} setNav={setNav} />
        <main className="flex-1">
          <Topbar onLogout={onLogout} />
          {children}
        </main>
      </div>
    </div>
  );
}
