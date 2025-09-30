// Types for conversations feature

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  chat_type: 'normativa_nacional' | 'constituciones';
  snippet: string;
  create_time: string;
  update_time: string;
  is_archived: boolean;
  total_tokens: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface CreateConversationRequest {
  title?: string;
  chat_type: 'normativa_nacional' | 'constituciones';
  system_prompt?: string;
}

export interface SendMessageRequest {
  content: string;
  session_id?: string;
  chat_type: 'normativa_nacional' | 'constituciones';
}

export interface SendMessageResponse {
  content: string;
  session_id: string;
  done?: boolean;
  error?: boolean;
}

export type ChatType = 'normativa_nacional' | 'constituciones';
