import React from "react";
import { MoreHorizontal, Pencil, Trash2, X, Stethoscope, ChevronLeft, Menu, Plus } from "lucide-react";
import { Conversation } from "../../types/chat";
import { Button } from "../ui/Button";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;

  onRename: (id: string, newTitle: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export const ChatSidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  // menu
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  // rename modal
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameBusy, setRenameBusy] = React.useState(false);

  // delete confirm modal
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // click outside closes dropdown
  React.useEffect(() => {
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const activeConv = React.useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const renameConv = React.useMemo(
    () => conversations.find((c) => c.id === renameId) ?? null,
    [conversations, renameId],
  );

  const deleteConv = React.useMemo(
    () => conversations.find((c) => c.id === deleteId) ?? null,
    [conversations, deleteId],
  );

  const openRename = (conv: Conversation) => {
    setOpenMenuId(null);
    setRenameId(conv.id);
    setRenameValue(conv.title ?? "");
  };

  const submitRename = async () => {
    if (!renameId) return;
    const next = renameValue.trim();
    if (!next) return;

    try {
      setRenameBusy(true);
      await onRename(renameId, next);
      setRenameId(null);
    } finally {
      setRenameBusy(false);
    }
  };

  const openDelete = (conv: Conversation) => {
    setOpenMenuId(null);
    setDeleteId(conv.id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteBusy(true);
      await onDelete(deleteId);

      // nếu đang active bị xóa, bạn có thể auto chuyển sang conv khác ở layer cha.
      // ở đây chỉ đóng dialog.
      setDeleteId(null);
    } finally {
      setDeleteBusy(false);
    }
  };

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
        {!collapsed && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                {/* giữ icon cũ của bạn nếu muốn */}
                <Stethoscope className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                HealthAssist
              </h1>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        )}

        {collapsed && (
          <div className="py-4 flex flex-col items-center gap-4">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>

            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <Stethoscope className="w-6 h-6" />
            </div>

            <button
              onClick={onNew}
              className="w-10 h-10 rounded-full bg-purple-600 shadow-purple-500/20 hover:bg-purple-700 text-white flex items-center justify-center"
              title="New Consultation"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="px-4 pb-4">
            <Button
              variant="secondary"
              className="w-full py-3 flex items-center justify-center text-sm"
              onClick={onNew}
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>New Consultation</span>
            </Button>
          </div>
        )}
      </div>

      {/* ================= SESSION LIST ================= */}
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
          {conversations.map((conv) => {
            const isActive = activeId === conv.id;
            const isOpen = openMenuId === conv.id;

            return (
              <div key={conv.id} className="relative group">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`
                    w-full text-left p-4 pr-12 rounded-2xl transition-all relative
                    ${isActive
                      ? "bg-primary/5 border-l-4 border-primary"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-transparent"
                    }
                  `}
                >
                  <p className="text-sm font-bold truncate">{conv.title}</p>

                  {/* 3 dots (hover show) */}
                  <span
                    className={`
                      absolute right-3 top-1/2 -translate-y-1/2
                      opacity-0 group-hover:opacity-100 transition-opacity
                      ${isOpen ? "opacity-100" : ""}
                    `}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) =>
                          prev === conv.id ? null : conv.id,
                        );
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="Conversation menu"
                      title="More"
                    >
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                  </span>
                </button>

                {/* dropdown */}
                {isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute right-3 top-[54px] z-50 w-44
                      rounded-xl border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-900 shadow-lg overflow-hidden
                    "
                  >
                    <button
                      className="
                        w-full px-3 py-2 text-left text-sm
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        flex items-center gap-2
                      "
                      onClick={() => openRename(conv)}
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                      Rename
                    </button>

                    <button
                      className="
                        w-full px-3 py-2 text-left text-sm
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        flex items-center gap-2 text-red-600
                      "
                      onClick={() => openDelete(conv)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= RENAME DIALOG ================= */}
      {
        renameId && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            onClick={() => !renameBusy && setRenameId(null)}
          >
            <div className="absolute inset-0 bg-black/40" />

            <div
              className="
              relative w-[92vw] max-w-md
              rounded-2xl bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              shadow-2xl p-5
            "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold">Rename session</h2>
                <button
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => !renameBusy && setRenameId(null)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <p className="text-sm text-slate-500 mb-3">
                Rename{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {renameConv?.title ?? "this session"}
                </span>
              </p>

              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape" && !renameBusy) setRenameId(null);
                }}
                autoFocus
                className="
                w-full rounded-xl px-3 py-2
                border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-950
                outline-none focus:ring-2 focus:ring-primary/30
              "
                placeholder="New name..."
                disabled={renameBusy}
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setRenameId(null)}
                  disabled={renameBusy}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={submitRename}
                  disabled={renameBusy || !renameValue.trim()}
                >
                  {renameBusy ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      {
        deleteId && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            onClick={() => !deleteBusy && setDeleteId(null)}
          >
            <div className="absolute inset-0 bg-black/40" />

            <div
              className="
              relative w-[92vw] max-w-md
              rounded-2xl bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              shadow-2xl p-5
            "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-red-600">
                  Delete session?
                </h2>
                <button
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => !deleteBusy && setDeleteId(null)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <p className="text-sm text-slate-500">
                This will permanently delete{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {deleteConv?.title ?? "this session"}
                </span>
                . You can’t undo this action.
              </p>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteId(null)}
                  disabled={deleteBusy}
                >
                  Cancel
                </Button>

                <Button
                  variant="secondary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDelete}
                  disabled={deleteBusy}
                >
                  {deleteBusy ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </aside>
  );
};
