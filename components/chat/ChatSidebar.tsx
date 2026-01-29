import React from "react";
import { Conversation } from "../../types/chat";
import { Button } from "../ui/Button";
import { ProfileMenuDialog } from "./ProfileMenuDialog";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export const ChatSidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <aside
      className={`
        ${collapsed ? "w-16" : "w-80"}
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800
        flex flex-col h-full shrink-0
        transition-[width] duration-300 ease-in-out
      `}
    >
      {/* ================= HEADER ================= */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        {/* ===== EXPANDED HEADER ===== */}
        {!collapsed && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-icons-round">medical_services</span>
              </div>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                HealthAssist
              </h1>
            </div>

            {/* Collapse button (RIGHT) */}
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-icons-round text-slate-400">
                chevron_left
              </span>
            </button>
          </div>
        )}

        {/* ===== COLLAPSED HEADER (RAIL TOP) ===== */}
        {collapsed && (
          <div className="py-4 flex flex-col items-center gap-4">
            {/* Expand button (TOP) */}
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-icons-round text-slate-400">menu</span>
            </button>

            {/* App icon */}
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-icons-round">medical_services</span>
            </div>

            {/* New chat (icon only) */}
            <button
              onClick={onNew}
              className="w-10 h-10 rounded-full bg-purple-600 shadow-purple-500/20 hover:bg-purple-700 text-white flex items-center justify-center"
              title="New Consultation"
            >
              <span className="material-icons-round">add</span>
            </button>
          </div>
        )}

        {/* ===== NEW CHAT (EXPANDED ONLY) ===== */}
        {!collapsed && (
          <div className="px-4 pb-4">
            <Button
              variant="secondary"
              className="w-full py-3 flex items-center justify-center text-sm"
              onClick={onNew}
            >
              <span className="material-icons-round">add</span>
              <span className="ml-2">New Consultation</span>
            </Button>
          </div>
        )}
      </div>

      {/* ================= SESSION LIST (GIỮ SLOT – ẨN KHI COLLAPSED) ================= */}
      <div
        className={`
          flex-1 overflow-y-auto p-4 custom-scrollbar
          transition-opacity duration-200
          ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
      >
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
          Recent Sessions
        </h3>

        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`
                w-full text-left p-4 rounded-2xl transition-all
                ${
                  activeId === conv.id
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-transparent"
                }
              `}
            >
              <p className="text-sm font-bold truncate">{conv.title}</p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
