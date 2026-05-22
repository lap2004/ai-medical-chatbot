import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

export function useChat() {
  const store = useChatStore();

  useEffect(() => {
    store.loadConversationsFromBackend();
  }, []);

  useEffect(() => {
    if (store.activeId && store.conversations.length > 0) {
      const conv = store.conversations.find((c) => c.id === store.activeId);
      if (conv && !conv.isLoaded) {
        store.selectConversation(store.activeId);
      }
    }
  }, [store.activeId, store.conversations]);

  const activeConversation =
    store.conversations.find((c) => c.id === store.activeId) || null;

  return {
    conversations: store.conversations,
    activeConversation,
    sendMessage: store.sendMessage,
    createNewConversation: store.createNewConversation,
    selectConversation: store.selectConversation,
    deleteConversation: store.deleteConversation,
    renameConversation: store.renameConversation,
    submitFeedback: store.submitFeedback,
    loading: store.loading,
    loadingConversations: store.loadingConversations,
    activeId: store.activeId,
    chatError: store.chatError,
    clearChatError: store.clearChatError,
    refreshConversations: store.loadConversationsFromBackend,
  };
}
