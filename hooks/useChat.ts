
import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message } from '../types/chat';
import { storage } from '../lib/storage';
import { getAIResponse } from '../lib/ai/mockAI';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConversations(storage.getConversations());
    setActiveId(storage.getActiveId());
  }, []);

  const saveState = (updated: Conversation[]) => {
    setConversations(updated);
    storage.saveConversations(updated);
  };

  const createNewConversation = useCallback(() => {
    const id = Date.now().toString();
    const newConv: Conversation = {
      id,
      title: 'New Consultation',
      createdAt: Date.now(),
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m Rebecca, your medical assistant. How can I assist you today?',
        createdAt: Date.now(),
      }],
    };
    const updated = [newConv, ...conversations];
    saveState(updated);
    setActiveId(id);
    storage.setActiveId(id);
    return id;
  }, [conversations]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    let currentId = activeId;
    if (!currentId) {
      currentId = createNewConversation();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    const updatedConvs = conversations.map(c => {
      if (c.id === currentId) {
        return { 
          ...c, 
          messages: [...c.messages, userMsg],
          title: c.messages.length === 1 ? content.slice(0, 30) + '...' : c.title
        };
      }
      return c;
    });

    saveState(updatedConvs);
    setLoading(true);

    try {
      const aiResponseData = await getAIResponse(content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseData.content || '',
        createdAt: Date.now(),
        triage: aiResponseData.triage,
      };

      const finalConvs = updatedConvs.map(c => 
        c.id === currentId ? { ...c, messages: [...c.messages, aiMsg] } : c
      );
      saveState(finalConvs);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    storage.setActiveId(id);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    saveState(updated);
    if (activeId === id) {
      setActiveId(null);
      storage.setActiveId(null);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  return {
    conversations,
    activeConversation,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    loading,
    activeId
  };
}
