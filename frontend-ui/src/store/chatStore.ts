import { create } from "zustand";
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
} from "@/services/apis/chat";

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  loadingConversations: boolean;
  chatError: string | null;

  setConversations: (conversations: Conversation[]) => void;
  setActiveId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setChatError: (error: string | null) => void;

  loadConversationsFromBackend: () => Promise<void>;
  createNewConversation: () => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<boolean>;
  submitFeedback: (messageId: string, action: "like" | "dislike" | "report", options?: any) => Promise<boolean>;
  sendMessage: (content: string) => Promise<void>;
  clearChatError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  loading: false,
  loadingConversations: false,
  chatError: null,

  setConversations: (conversations) => {
    storage.saveConversations(conversations);
    set({ conversations });
  },
  
  setActiveId: (id) => {
    storage.setActiveId(id);
    set({ activeId: id });
  },

  setLoading: (loading) => set({ loading }),
  
  setChatError: (error) => set({ chatError: error }),
  
  clearChatError: () => set({ chatError: null }),

  loadConversationsFromBackend: async () => {
    try {
      set({ loadingConversations: true });
      const backendConvs = await apiGetConversations();
      const localConvs: Conversation[] = backendConvs.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.updated_at).getTime(),
        messages: [], 
        isLoaded: false,
      }));
      get().setConversations(localConvs);
      const savedActiveId = storage.getActiveId();
      if (savedActiveId && localConvs.some(c => c.id === savedActiveId)) {
        get().setActiveId(savedActiveId);
      }
    } catch (error) {
      console.error("Error loading conversations from backend:", error);
      get().setConversations(storage.getConversations());
      get().setActiveId(storage.getActiveId() ?? null);
    } finally {
      set({ loadingConversations: false });
    }
  },

  createNewConversation: async () => {
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
      const updated = [localConv, ...get().conversations];
      get().setConversations(updated);
      get().setActiveId(newConv.id);
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
      const updated = [newConv, ...get().conversations];
      get().setConversations(updated);
      get().setActiveId(id);
      return id;
    }
  },

  selectConversation: async (id: string) => {
    get().setActiveId(id);
    try {
      const conv = get().conversations.find(c => c.id === id);
      if (conv && !conv.isLoaded) {
        set({ loading: true });
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
        
        const updated = get().conversations.map(c =>
          c.id === id ? { ...c, messages: localMessages, isLoaded: true } : c
        );
        get().setConversations(updated);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      set({ loading: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await apiDeleteConversation(id);
    } catch (error) {
      console.error("Error deleting conversation on backend:", error);
    }
    const updated = get().conversations.filter((c) => c.id !== id);
    get().setConversations(updated);
    
    if (get().activeId === id) {
      get().setActiveId(null);
    }
  },

  renameConversation: async (id: string, newTitle: string) => {
    try {
      await apiRenameConversation(id, newTitle);
      const updated = get().conversations.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c
      );
      get().setConversations(updated);
      return true;
    } catch (error) {
      console.error("Error renaming conversation on backend:", error);
      return false;
    }
  },

  submitFeedback: async (messageId: string, action: "like" | "dislike" | "report", options?: any) => {
    try {
      await apiSubmitMessageFeedback(messageId, {
        action,
        ...options
      });
      const updated = get().conversations.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          if (action === "report") {
            return { ...msg, is_reported: true };
          }
          return { ...msg, feedback: action };
        })
      }));
      get().setConversations(updated);
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }
  },

  sendMessage: async (content: string) => {
    const text = content.trim();
    if (!text || get().loading) return;

    let currentId = get().activeId;
    if (!currentId) {
      currentId = await get().createNewConversation();
    }

    const now = Date.now();
    const userMsg: Message = {
      id: `${now}`,
      role: "user",
      content: text,
      createdAt: now,
    };

    const updated = get().conversations.map((c) => {
      if (c.id !== currentId) return c;
      const nextTitle = c.messages.length === 1 ? `${text.slice(0, 30)}...` : c.title;
      return {
        ...c,
        title: nextTitle,
        messages: [...c.messages, userMsg],
      };
    });
    get().setConversations(updated);
    set({ loading: true });

    try {
      const res = await chat({
        question: text,
        conversation_id: currentId,
        parent_message_id: null,
      });
      const aiText: string = res?.assistant_answer?.answer ?? "Xin lỗi, tôi chưa nhận được câu trả lời từ hệ thống.";
      const aiMsg: Message = {
        id: res?.assistant_message_id ?? `${Date.now()}_ai`,
        role: "assistant",
        content: aiText,
        createdAt: new Date(res?.created_at ?? Date.now()).getTime(),
      };
      
      const newConversations = get().conversations.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c
      );
      get().setConversations(newConversations);
    } catch (err: any) {
      const apiDetail: string | undefined =
        err?.response?.data?.detail ??
        (typeof err?.response?.data === "string" ? err.response.data : undefined) ??
        (err?.message && err.message !== "Network Error" ? err.message : undefined);
      const errorContent = apiDetail
        ? apiDetail
        : "Không kết nối được tới hệ thống chat. Bạn thử lại sau hoặc kiểm tra API giúp mình nhé.";
      
      set({ chatError: errorContent });
      const aiMsg: Message = {
        id: `${Date.now()}_err`,
        role: "assistant",
        content: "Vui lòng thử lại.",
        createdAt: Date.now(),
      };
      
      const newConversations = get().conversations.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c
      );
      get().setConversations(newConversations);
    } finally {
      set({ loading: false });
    }
  }
}));
