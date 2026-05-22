import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { Conversation, Message } from "@/types/chat";
import {
  chat,
  getConversations as apiGetConversations,
  createConversation as apiCreateConversation,
  getMessages as apiGetMessages,
  deleteConversation as apiDeleteConversation,
  renameConversation as apiRenameConversation,
  submitMessageFeedback as apiSubmitMessageFeedback,
} from "../apis/chat";
export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const reqSeqRef = useRef(0);
  useEffect(() => {
    loadConversationsFromBackend();
  }, []);
  const loadConversationsFromBackend = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const backendConvs = await apiGetConversations();
      const localConvs: Conversation[] = backendConvs.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.updated_at).getTime(),
        messages: [], 
        isLoaded: false,
      }));
      setConversations(localConvs);
      const savedActiveId = storage.getActiveId();
      if (savedActiveId && localConvs.some(c => c.id === savedActiveId)) {
        setActiveId(savedActiveId);
      }
    } catch (error) {
      console.error("Error loading conversations from backend:", error);
      const localConvs = storage.getConversations();
      setConversations(localConvs);
      setActiveId(storage.getActiveId());
    } finally {
      setLoadingConversations(false);
    }
  }, []);
  const persist = useCallback(
    (updated: Conversation[], nextActiveId?: string | null) => {
      setConversations(updated);
      storage.saveConversations(updated);
      if (typeof nextActiveId !== "undefined") {
        setActiveId(nextActiveId);
        storage.setActiveId(nextActiveId);
      }
    },
    [],
  );
  const createNewConversation = useCallback(async () => {
    try {
      const newConv = await apiCreateConversation();
      const localConv: Conversation = {
        id: newConv.id,
        title: newConv.title,
        createdAt: new Date(newConv.created_at).getTime(),
        messages: [
          {
            id: `welcome_${newConv.id}`,
            role: "assistant",
            content: "Xin chào, tôi là trợ lý sức khỏe AI. Tôi có thể giúp gì cho bạn?",
            createdAt: Date.now(),
          },
        ],
        isLoaded: true,
      };
      setConversations((prev) => {
        const updated = [localConv, ...prev];
        storage.saveConversations(updated);
        return updated;
      });
      setActiveId(newConv.id);
      storage.setActiveId(newConv.id);
      return newConv.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      const id = Date.now().toString();
      const now = Date.now();
      const newConv: Conversation = {
        id,
        title: "New Conversation",
        createdAt: now,
        messages: [
          {
            id: `welcome_${id}`,
            role: "assistant",
            content: "Xin chào, tôi là trợ lý sức khỏe AI. Tôi có thể giúp gì cho bạn?",
            createdAt: now,
          },
        ],
        isLoaded: true,
      };
      setConversations((prev) => {
        const updated = [newConv, ...prev];
        storage.saveConversations(updated);
        return updated;
      });
      setActiveId(id);
      storage.setActiveId(id);
      return id;
    }
  }, []);
  const selectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    storage.setActiveId(id);
    try {
      const conv = conversations.find(c => c.id === id);
      if (conv && !conv.isLoaded) {
        setLoading(true); 
        const backendMessages = await apiGetMessages(id);
        const localMessages: Message[] = backendMessages
          .filter(msg => msg.role === "user" || msg.role === "assistant")
          .map(msg => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: new Date(msg.created_at).getTime(),
            feedback: msg.feedback?.value as "like" | "dislike" | undefined,
            is_reported: msg.is_reported || false,
          }));
        setConversations(prev => prev.map(c =>
          c.id === id ? { ...c, messages: localMessages, isLoaded: true } : c
        ));
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversations]);
  useEffect(() => {
    if (activeId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === activeId);
      if (conv && !conv.isLoaded) {
        selectConversation(activeId);
      }
    }
  }, [activeId, conversations, selectConversation]);
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await apiDeleteConversation(id);
    } catch (error) {
      console.error("Error deleting conversation on backend:", error);
    }
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storage.saveConversations(updated);
      return updated;
    });
    setActiveId((prevActive) => {
      if (prevActive === id) {
        storage.setActiveId(null);
        return null;
      }
      return prevActive;
    });
  }, []);
  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      await apiRenameConversation(id, newTitle);
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, title: newTitle } : c
        );
        storage.saveConversations(updated);
        return updated;
      });
      return true;
    } catch (error) {
      console.error("Error renaming conversation on backend:", error);
      return false;
    }
  }, []);
  const submitFeedback = useCallback(async (
    messageId: string,
    action: "like" | "dislike" | "report",
    options?: { reason?: string; category?: string; details?: string }
  ) => {
    try {
      await apiSubmitMessageFeedback(messageId, {
        action,
        ...options
      });
      setConversations(prev => {
        const updated = prev.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => {
            if (msg.id !== messageId) return msg;
            if (action === "report") {
              return { ...msg, is_reported: true };
            }
            return { ...msg, feedback: action };
          })
        }));
        storage.saveConversations(updated);
        return updated;
      });
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }
  }, [conversations]);
  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;
      if (loading) return;
      let currentId = activeId;
      if (!currentId) {
        currentId = await createNewConversation();
      }
      const now = Date.now();
      const userMsg: Message = {
        id: `${now}`,
        role: "user",
        content: text,
        createdAt: now,
      };
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== currentId) return c;
          const nextTitle =
            c.messages.length === 1 ? `${text.slice(0, 30)}...` : c.title;
          return {
            ...c,
            title: nextTitle,
            messages: [...c.messages, userMsg],
          };
        });
        storage.saveConversations(updated);
        return updated;
      });
      setLoading(true);
      const mySeq = ++reqSeqRef.current;
      try {
        const res = await chat({
          question: text,
          conversation_id: currentId,
          parent_message_id: null,
        });
        const aiText: string =
          res?.assistant_answer?.answer ??
          "Xin lỗi, tôi chưa nhận được câu trả lời từ hệ thống.";
        const aiMsg: Message = {
          id: res?.assistant_message_id ?? `${Date.now()}_ai`,
          role: "assistant",
          content: aiText,
          createdAt: new Date(res?.created_at ?? Date.now()).getTime(),
        };
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c,
          );
          storage.saveConversations(updated);
          return updated;
        });
      } catch (err: any) {
        const apiDetail: string | undefined =
          err?.response?.data?.detail ??
          (typeof err?.response?.data === "string" ? err.response.data : undefined) ??
          (err?.message && err.message !== "Network Error" ? err.message : undefined);
        const errorContent = apiDetail
          ? apiDetail
          : "Không kết nối được tới hệ thống chat. Bạn thử lại sau hoặc kiểm tra API giúp mình nhé.";
        setChatError(errorContent);
        const aiMsg: Message = {
          id: `${Date.now()}_err`,
          role: "assistant",
          content: "Vui lòng thử lại.",
          createdAt: Date.now(),
        };
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c,
          );
          storage.saveConversations(updated);
          return updated;
        });
      } finally {
        if (reqSeqRef.current === mySeq) setLoading(false);
      }
    },
    [activeId, createNewConversation, loading],
  );
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  );
  return {
    conversations,
    activeConversation,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    submitFeedback,
    loading,
    loadingConversations,
    activeId,
    chatError,
    clearChatError: () => setChatError(null),
    refreshConversations: loadConversationsFromBackend,
  };
}
