import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { Conversation, Message } from "@/types/chat";
import { chat } from "../apis/chat";

function getOrCreateUserId() {
  const key = "chat_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, id);
  return id;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // user_id dùng cho API
  const userIdRef = useRef<string>("");

  // chống setLoading sai khi có nhiều request (spam send)
  const reqSeqRef = useRef(0);

  useEffect(() => {
    const convs = storage.getConversations();
    const act = storage.getActiveId();

    setConversations(convs);
    setActiveId(act);

    userIdRef.current = getOrCreateUserId();
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

  const createNewConversation = useCallback(() => {
    const id = Date.now().toString();
    const now = Date.now();

    const newConv: Conversation = {
      id,
      title: "New Consultation",
      createdAt: now,
      messages: [
        {
          id: `welcome_${id}`,
          role: "assistant",
          content:
            "Xin chào, tôi là trợ lý ảo của trường Đại học Văn Lang. Tôi có thể giúp gì cho bạn?",
          createdAt: now,
        },
      ],
    };

    setConversations((prev) => {
      const updated = [newConv, ...prev];
      storage.saveConversations(updated);
      return updated;
    });

    setActiveId(id);
    storage.setActiveId(id);

    return id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    storage.setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
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

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;

      // nếu bạn muốn chặn gửi khi đang loading:
      if (loading) return;

      // đảm bảo có active conversation
      let currentId = activeId;
      if (!currentId) currentId = createNewConversation();

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

      // 2) call API
      setLoading(true);
      const mySeq = ++reqSeqRef.current;

      try {
        const res = await chat({
          question: text,
          user_id: userIdRef.current,
        });

        // restTransport có thể trả payload trực tiếp hoặc { data: payload }
        const data: any = (res as any)?.data ?? res;

        const aiText: string =
          data?.answer?.answer ??
          "Xin lỗi, tôi chưa nhận được câu trả lời từ hệ thống.";

        const aiMsg: Message = {
          id: `${Date.now()}_ai`,
          role: "assistant",
          content: aiText,
          createdAt: Date.now(),
          // nếu bạn đã mở rộng type Message có contexts thì giữ lại dòng này
          // contexts: data?.contexts || [],
        };

        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c,
          );
          storage.saveConversations(updated);
          return updated;
        });
      } catch (err) {
        const aiMsg: Message = {
          id: `${Date.now()}_err`,
          role: "assistant",
          content:
            "Không kết nối được tới hệ thống chat. Bạn thử lại sau hoặc kiểm tra API giúp mình nhé.",
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
    loading,
    activeId,
  };
}
