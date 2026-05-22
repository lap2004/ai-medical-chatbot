
import React from "react";
import type { ReactionState } from "@/types/chat";
type Props = {
  visible: boolean;
  disabled?: boolean;
  reaction: ReactionState;
  isReported?: boolean;  
  onLike: () => void;
  onDislike: () => void;
  onReport: () => void;
  onCopy: () => void;
};
export const MessageActions: React.FC<Props> = ({
  visible,
  disabled,
  reaction,
  isReported,  
  onLike,
  onDislike,
  onReport,
  onCopy,
}) => {
  return (
    <div
      className={[
        "absolute -bottom-2.5 right-3 z-20",
        "transition-all duration-150",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-1 pointer-events-none",
      ].join(" ")}
    >
      <div
        className="
        flex items-center gap-0.5
        rounded-xl
        border border-slate-200/70 dark:border-slate-700/70
        bg-white/95 dark:bg-slate-900/95
        shadow-md backdrop-blur
        px-1.5 py-1
      "
      >
        {/* Like */}
        <button
          disabled={disabled}
          onClick={onLike}
          className={`
            w-8 h-8 rounded-lg
            flex items-center justify-center
            transition
            ${reaction === "like"
              ? "bg-primary/10 text-primary"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          `}
        >
          <span className="material-icons-round text-[18px] leading-none">
            thumb_up
          </span>
        </button>
        {/* Dislike */}
        <button
          disabled={disabled}
          onClick={onDislike}
          className={`
            w-8 h-8 rounded-lg
            flex items-center justify-center
            transition
            ${reaction === "dislike"
              ? "bg-red-500/10 text-red-600"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          `}
        >
          <span className="material-icons-round text-[18px] leading-none">
            thumb_down
          </span>
        </button>
        {/* Copy */}
        <button
          disabled={disabled}
          onClick={onCopy}
          className="
            w-8 h-8 rounded-lg
            flex items-center justify-center
            text-slate-500
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition
          "
        >
          <span className="material-icons-round text-[18px] leading-none">
            content_copy
          </span>
        </button>
        {/* Report - Only show if not already reported */}
        {!isReported && (
          <button
            disabled={disabled}
            onClick={onReport}
            className="
              w-8 h-8 rounded-lg
              flex items-center justify-center
              text-slate-500
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition
            "
          >
            <span className="material-icons-round text-[18px] leading-none">
              flag
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
