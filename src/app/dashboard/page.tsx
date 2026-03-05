import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { NavKey } from "@/types/admin";
import { useNavigate } from "react-router-dom";
import UsersTab from "./UsersTab";
import DashboardView from "./DashboardView";
import AnalyticsView from "./AnalyticsView";
import SettingsView from "./SettingsView";

export default function UserManagementDashboard() {
  const navigate = useNavigate();
  const [nav, setNav] = React.useState<NavKey>("dashboard"); // Default to Dashboard

  const handleLogout = () => navigate("/");

  // Render content based on active tab
  const renderContent = () => {
    switch (nav) {
      case "dashboard":
        return <DashboardView />;
      case "users":
        return <UsersTab />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AdminLayout nav={nav} setNav={setNav} onLogout={handleLogout}>
      <div className="px-7 py-6">
        {/* Header/Title could go here if needed per tab */}

        <div className="mt-4">
          {renderContent()}
        </div>

        <div className="text-center text-[10px] text-slate-300 mt-8">
          © 2026 AI Doctor Assistant Management System. All rights reserved.
        </div>
      </div>
    </AdminLayout>
  );
}
