// Types for conversations feature

export type FeedbackType = 'like' | 'dislike';

export interface MessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  metadata?: Record<string, unknown>;
  attached_file_names?: string[];  // Names of files attached to this message
  created_at: string;
  feedback?: FeedbackType;  // User's feedback on this message
  relevant_docs?: number[];  // Relevant document/norma IDs used as context for this message
}

export interface Conversation {
  id: string;
  title: string;
  chat_type: 'normativa_nacional' | 'constituciones' | 'norma_chat';
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
  chat_type: 'normativa_nacional' | 'constituciones' | 'norma_chat';
  system_prompt?: string;
}

export interface FileAttachment {
  name: string;
  mime_type: string;
  data: string; // base64 encoded
}

export interface SendMessageRequest {
  content: string;
  session_id?: string;
  chat_type: 'normativa_nacional' | 'constituciones' | 'norma_chat';
  tone?: ToneType;
  files?: FileAttachment[];
}

export interface SendMessageResponse {
  content: string;
  session_id: string;
  done?: boolean;
  error?: boolean;
  norma_ids?: number[];
}

export interface FeedbackCreateRequest {
  message_id: string;
  feedback_type: FeedbackType;
}

export type ChatType = 'normativa_nacional' | 'constituciones' | 'norma_chat';

export type ToneType = 'default' | 'formal' | 'academico' | 'conciso';
