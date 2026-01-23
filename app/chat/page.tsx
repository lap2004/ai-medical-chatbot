import React from "react";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { useChat } from "@/services/hooks/hookChat";
import { ChatMessageList } from "../../components/chat/ChatMessageList";
import { ChatComposer } from "../../components/chat/ChatComposer";

const ChatPage: React.FC = () => {
  const {
    conversations,
    activeConversation,
    sendMessage,
    createNewConversation,
    selectConversation,
    activeId,
    loading,
  } = useChat();

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={createNewConversation}
      />

      <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
        <ChatHeader />

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
          />
        )}

        <ChatComposer loading={loading} onSend={sendMessage} />
      </main>
    </div>
  );
};

export default ChatPage;
