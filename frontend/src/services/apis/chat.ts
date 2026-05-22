import { restTransport } from "@/lib/api";

const { get, post, patch, _delete } = restTransport();

// ============================================
// Types
// ============================================

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  last_message_at: string;
}

export interface CreateConversationResponse {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parent_message_id: string | null;
  created_at: string;
  // Feedback info from backend
  feedback?: {
    value: "like" | "dislike";
    created_at: string;
  };
  is_reported?: boolean;
}

export interface ChatRequest {
  question: string;
  conversation_id?: string | null;
  parent_message_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  user_id: number;
  user_message_id: string;
  assistant_message_id: string;
  user_content: string;
  assistant_answer: {
    answer: string;
    reasoning_brief?: string;
    references: string[];
    safety: {
      urgency: "emergency" | "urgent" | "routine";
      rationale: string;
    };
  };
  contexts: Array<{
    text: string;
    score: number;
  }>;
  created_at: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Lấy danh sách conversations của user hiện tại
 */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await get("/conversations");
  return response.data;
};

/**
 * Tạo conversation mới
 */
export const createConversation = async (): Promise<CreateConversationResponse> => {
  const response = await post("/conversations", {});
  return response.data;
};

/**
 * Lấy danh sách messages trong một conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await get(`/conversations/${conversationId}/messages`);
  // API returns {items: [...]} format
  return response.data.items || response.data;
};

/**
 * Gửi message vào conversation (chạy RAG và nhận trả lời)
 * API legacy - tự động tạo conversation nếu chưa có
 */
export const chat = async (body: ChatRequest): Promise<ChatResponse> => {
  const response = await post("/chat", body);
  return response.data;
};

/**
 * Đổi tên conversation
 */
export const renameConversation = async (
  conversationId: string,
  title: string
): Promise<{ id: string; title: string; updated_at: string }> => {
  const response = await patch(`/conversations/${conversationId}`, { title });
  return response.data;
};

/**
 * Xóa conversation (soft delete)
 */
export const deleteConversation = async (
  conversationId: string
): Promise<{ deleted: boolean; conversation_id: string }> => {
  const response = await _delete(`/conversations/${conversationId}`);
  return response.data;
};

// ============================================
// Message Feedback (Like/Dislike/Report)
// ============================================

export interface MessageFeedback {
  action: "like" | "dislike" | "report";
  reason?: string;
  category?: string;
  details?: string;
}

export interface MessageFeedbackResponse {
  ok: boolean;
}

/**
 * Submit feedback for a message (like/dislike/report)
 */
export const submitMessageFeedback = async (
  messageId: string,
  feedback: MessageFeedback
): Promise<MessageFeedbackResponse> => {
  const response = await post(`/chat/messages/${messageId}/feedback`, feedback);
  return response.data;
};
