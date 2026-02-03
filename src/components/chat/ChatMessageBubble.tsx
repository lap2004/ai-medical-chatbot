// ChatMessageBubble.tsx
import React, { useCallback, useEffect, useState } from "react";
import { MessageActions } from "./MessageActions";
import { ReportDialog } from "./ReportDialog";
import { ChatMsg, ReactionState, ImproveAction } from "@/types/chat";

type Props = {
  msg: ChatMsg;
  loading?: boolean;

  reaction?: ReactionState;
  saved?: boolean;

  onReact?: (id: string, next: ReactionState) => Promise<void> | void;
  onReport?: (
    id: string,
    payload: { reason: string; note?: string },
  ) => Promise<void> | void;
  onSave?: (id: string, next: boolean) => Promise<void> | void;
  onRegenerate?: (id: string) => Promise<void> | void;
  onImprove?: (id: string, action: ImproveAction) => Promise<void> | void;
};

export const ChatMessageBubble: React.FC<Props> = ({
  msg,
  loading,
  reaction = "none",
  saved = false,
  onReact,
  onReport,
  onSave,
  onRegenerate,
  onImprove,
}) => {
  const isAssistant = msg.role === "assistant";
  const isActionEnabled = isAssistant && (msg.fromApi ?? true);

  const [hovered, setHovered] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // optimistic UI
  const [localReaction, setLocalReaction] = useState<ReactionState>(reaction);
  const [localSaved, setLocalSaved] = useState(saved);

  useEffect(() => setLocalReaction(reaction), [reaction]);
  useEffect(() => setLocalSaved(saved), [saved]);

  const visible = isActionEnabled && hovered;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      console.log("Copied");
    } catch {
      console.log("Copy failed");
    }
  }, [msg.content]);

  const handleLike = useCallback(async () => {
    const next: ReactionState = localReaction === "like" ? "none" : "like";
    setLocalReaction(next);
    await onReact?.(msg.id, next);
  }, [localReaction, msg.id, onReact]);

  const handleDislike = useCallback(async () => {
    const next: ReactionState =
      localReaction === "dislike" ? "none" : "dislike";
    setLocalReaction(next);
    await onReact?.(msg.id, next);
  }, [localReaction, msg.id, onReact]);

  const handleSave = useCallback(async () => {
    const next = !localSaved;
    setLocalSaved(next);
    await onSave?.(msg.id, next);
  }, [localSaved, msg.id, onSave]);

  const handleRegenerate = useCallback(async () => {
    await onRegenerate?.(msg.id);
  }, [msg.id, onRegenerate]);

  const handleImprove = useCallback(
    async (action: ImproveAction) => {
      await onImprove?.(msg.id, action);
    },
    [msg.id, onImprove],
  );

  const bubbleClass = isAssistant
    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
    : "bg-primary text-white";

  return (
    <div className="w-full flex">
      <div
        className={[
          "relative max-w-[85%] rounded-2xl px-4 py-3 group",
          bubbleClass,
          isAssistant ? "mr-auto" : "ml-auto",
        ].join(" ")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {msg.content}
        </div>

        {isActionEnabled && (
          <MessageActions
            visible={visible}
            disabled={!!loading}
            reaction={localReaction}
            isReported={msg.is_reported}  // ✅ Pass this
            onLike={handleLike}
            onDislike={handleDislike}
            onReport={() => setReportOpen(true)}
            onCopy={handleCopy}
          />
        )}

        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmit={(payload) => onReport?.(msg.id, payload)}
        />
      </div>
    </div>
  );
};
