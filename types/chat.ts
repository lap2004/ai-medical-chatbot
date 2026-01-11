
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  triage?: {
    questions: string[];
    suggestedAnswers: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}
