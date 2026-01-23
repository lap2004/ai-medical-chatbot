import React from "react";
import { Conversation } from "../../types/chat";
import { Button } from "../ui/Button";

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
  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <span className="material-icons-round">medical_services</span>
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">
            HealthAssist
          </h1>
        </div>
        <Button
          variant="secondary"
          className="w-full justify-center py-4 text-sm"
          onClick={onNew}
        >
          <span className="material-icons-round mr-2">add</span>
          New Consultation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">
            Recent Sessions
          </h3>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all group ${
                  activeId === conv.id
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p
                    className={`text-sm font-bold truncate ${activeId === conv.id ? "text-primary" : "text-slate-700 dark:text-slate-200"}`}
                  >
                    {conv.title}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(conv.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {conv.messages[conv.messages.length - 1]?.content}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
          <img
            alt="Alex Johnson"
            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700"
            src="https://picsum.photos/seed/alex/100/100"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate dark:text-white">
              Alex Johnson
            </p>
            <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
              Premium Member
            </p>
          </div>
          <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors">
            <span className="material-icons-round text-slate-400 text-lg">
              settings
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
