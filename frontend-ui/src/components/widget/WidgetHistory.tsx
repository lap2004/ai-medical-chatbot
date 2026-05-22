import { useChat } from "@/services/hooks/hookChat";
import React from "react";
export const WidgetHistory: React.FC<
  ReturnType<typeof useChat> & { onSelect: () => void }
> = ({ conversations, selectConversation, onSelect }) => {
  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20 h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-slate-800 dark:text-white">
          Recent Consultations
        </h3>
      </div>
      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-icons-round text-slate-300 text-5xl mb-2">
            history
          </span>
          <p className="text-sm text-slate-500">No history found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                selectConversation(conv.id);
                onSelect();
              }}
              className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate pr-4">
                  {conv.title}
                </h4>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {conv.messages[conv.messages.length - 1]?.content}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
