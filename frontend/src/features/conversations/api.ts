/**
 * API client for conversations backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const token = localStorage.getItem('access_token');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Import types
import type {
  Message,
  Conversation,
  ConversationDetail,
  ConversationListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ChatType
} from './types';

// Re-export types for convenience
export type {
  Message,
  Conversation,
  ConversationDetail,
  ConversationListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ChatType
};

// API Functions
export class ConversationsAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    return response.json();
  }

  static async getConversations(params?: {
    limit?: number;
    offset?: number;
    chat_type?: 'normativa_nacional' | 'constituciones';
    is_archived?: boolean;
  }): Promise<ConversationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.chat_type) searchParams.set('chat_type', params.chat_type);
    if (params?.is_archived !== undefined) searchParams.set('is_archived', params.is_archived.toString());

    const url = `${API_BASE}/conversations/${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return this.handleResponse<ConversationListResponse>(response);
  }

  static async getConversation(id: string): Promise<ConversationDetail> {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    return this.handleResponse<ConversationDetail>(response);
  }

  static async createConversation(data: CreateConversationRequest): Promise<ConversationDetail> {
    const response = await fetch(`${API_BASE}/conversations/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConversationDetail>(response);
  }

  static async updateConversation(
    id: string, 
    data: { title?: string; is_archived?: boolean }
  ): Promise<ConversationDetail> {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ConversationDetail>(response);
  }

  static async deleteConversation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  }

  static async sendMessage(
    data: SendMessageRequest,
    onChunk: (chunk: SendMessageResponse) => void,
    onComplete: (sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/conversations/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunkData: SendMessageResponse = JSON.parse(line.slice(6));
              onChunk(chunkData);
              
              if (chunkData.done) {
                onComplete(chunkData.session_id);
                return;
              }
              
              if (chunkData.error) {
                throw new Error('Server error in streaming response');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              onError(new Error('Failed to parse server response'));
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

