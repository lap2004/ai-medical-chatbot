export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  feedback?: "like" | "dislike";  
  is_reported?: boolean;  
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
  isLoaded?: boolean;
}
export type MsgRole = "user" | "assistant";
export type ImproveAction =
  | "shorter"
  | "detailed"
  | "explain"
  | "translate_vi"
  | "translate_en";
export type ReactionState = "none" | "like" | "dislike";
export type ChatMsg = {
  id: string;
  role: MsgRole;
  content: string;
  createdAt?: number;
  fromApi?: boolean;
  is_reported?: boolean;  
};
