
import { Conversation } from '../types/chat';
const KEYS = {
  CONVERSATIONS: 'ai_doctor_conversations',
  ACTIVE_ID: 'ai_doctor_active_conversation_id',
};
export const storage = {
  getConversations: (): Conversation[] => {
    const data = localStorage.getItem(KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  },
  saveConversations: (convs: Conversation[]) => {
    localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(convs));
  },
  getActiveId: (): string | null => {
    return localStorage.getItem(KEYS.ACTIVE_ID);
  },
  setActiveId: (id: string | null) => {
    if (id) localStorage.setItem(KEYS.ACTIVE_ID, id);
    else localStorage.removeItem(KEYS.ACTIVE_ID);
  },
};
