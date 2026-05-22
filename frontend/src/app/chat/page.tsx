import React from "react";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { VoiceMode } from "../../components/chat/VoiceMode";
import { useChat } from "@/services/hooks/hookChat";
import { ChatMessageList } from "../../components/chat/ChatMessageList";
import { ChatComposer } from "../../components/chat/ChatComposer";
import { toast } from "sonner";

const ChatPage: React.FC = () => {
  const [tab, setTab] = React.useState<"chat" | "voice">("chat");

  const {
    conversations,
    activeConversation,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    submitFeedback,
    activeId,
    loading,
    chatError,
    clearChatError,
  } = useChat();

  // Show toast when chat error occurs
  React.useEffect(() => {
    if (chatError) {
      toast.error(chatError, { duration: 5000 });
      clearChatError();
    }
  }, [chatError, clearChatError]);

  // Handle feedback reactions (like/dislike)
  const handleReact = async (messageId: string, reaction: "none" | "like" | "dislike") => {
    if (reaction === "none") return; // User toggled off
    await submitFeedback(messageId, reaction);
  };

  // Handle report
  const handleReport = async (messageId: string, payload: { reason: string; note?: string }) => {
    // Check if already reported
    const message = activeConversation?.messages.find(m => m.id === messageId);
    if (message?.is_reported) {
      toast.success("Bạn đã report message này rồi!");
      return;
    }

    await submitFeedback(messageId, "report", {
      category: payload.reason,
      details: payload.note,
    });

    toast.success("Report thành công, cảm ơn bạn rất nhiều");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={createNewConversation}
        onRename={renameConversation}
        onDelete={deleteConversation}
      />

      <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-950">
        <ChatHeader tab={tab} onTabChange={setTab} />

        {tab === "chat" ? (
          <>
            {!activeConversation ? (
              // giữ nguyên empty state của bạn (hoặc tách component)
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={createNewConversation}
                  className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <ChatMessageList
                messages={activeConversation.messages}
                loading={loading}
                onSelectTriage={(ans) => sendMessage(ans)}
                onReact={handleReact}
                onReport={handleReport}
              />
            )}
            <ChatComposer loading={loading} onSend={sendMessage} />
          </>
        ) : (
          <VoiceMode />
        )}
      </main>
    </div>
  );
};

export default ChatPage;
