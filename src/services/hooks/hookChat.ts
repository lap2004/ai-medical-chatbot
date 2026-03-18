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

  // chống setLoading sai khi có nhiều request (spam send)
  const reqSeqRef = useRef(0);

  // Load conversations từ backend khi component mount
  useEffect(() => {
    loadConversationsFromBackend();
  }, []);

  const loadConversationsFromBackend = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const backendConvs = await apiGetConversations();

      // Convert backend format sang local format
      const localConvs: Conversation[] = backendConvs.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.updated_at).getTime(),
        messages: [], // Messages sẽ được load khi cần
        isLoaded: false,
      }));

      setConversations(localConvs);

      // Restore active conversation từ localStorage
      const savedActiveId = storage.getActiveId();
      if (savedActiveId && localConvs.some(c => c.id === savedActiveId)) {
        setActiveId(savedActiveId);
      }
    } catch (error) {
      console.error("Error loading conversations from backend:", error);
      // Fallback to localStorage nếu backend fail
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
      // Tạo conversation trên backend
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
      // Fallback: tạo local conversation
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

    // Load messages từ backend nếu chưa có
    try {
      const conv = conversations.find(c => c.id === id);
      // Chỉ load nếu chưa có messages
      if (conv && !conv.isLoaded) {
        setLoading(true); // Show loading UI
        const backendMessages = await apiGetMessages(id);

        // Filter và convert messages (chỉ giữ user và assistant)
        const localMessages: Message[] = backendMessages
          .filter(msg => msg.role === "user" || msg.role === "assistant")
          .map(msg => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: new Date(msg.created_at).getTime(),
            // Map feedback từ backend response
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

  // ✅ Auto-load messages khi activeId thay đổi hoặc conversations init xong
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
      // Xóa trên backend
      await apiDeleteConversation(id);
    } catch (error) {
      console.error("Error deleting conversation on backend:", error);
    }

    // Xóa local
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
      // Đổi tên trên backend
      await apiRenameConversation(id, newTitle);

      // Cập nhật local
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

      // Cập nhật local state
      // Cập nhật local state
      setConversations(prev => {
        const updated = prev.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => {
            if (msg.id !== messageId) return msg;

            // Report: update is_reported field
            if (action === "report") {
              return { ...msg, is_reported: true };
            }

            // Like/Dislike: update feedback field
            return { ...msg, feedback: action };
          })
        }));

        // Save UPDATED state to storage immediately
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

      // nếu bạn muốn chặn gửi khi đang loading:
      if (loading) return;

      // đảm bảo có active conversation
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

      // 1) append user message (functional update để tránh stale)
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

      // 2) call API với conversation_id
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

        // Try to extract API error detail (axios HTTP error has .response.data.detail)
        // Fallback to err.message (network/timeout), then generic string
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
        // chỉ tắt loading nếu đây là request cuối cùng
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





