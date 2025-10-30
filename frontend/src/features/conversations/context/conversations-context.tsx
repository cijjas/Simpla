'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ConversationsAPI, type Message, type Conversation, type ChatType, type FeedbackType, type ToneType } from '../index';
import { useApi } from '@/features/auth/hooks/use-api';

// State interface
interface ConversationsState {
  conversations: Conversation[];
  // currentConversation removed - was duplicating messages array
  messages: Message[];
  currentSessionId: string | null; // Re-added: fallback when URL navigation hasn't completed yet
  chatType: ChatType;
  tone: ToneType;
  isLoading: boolean;
  // isStreaming removed - derived from streamingMessage !== ''
  streamingMessage: string;
  isLoadingConversations: boolean;
  // editingConversationId and tempTitle - handled in ConversationsSidebar component
}

// Derived state - computed from base state
interface ConversationsDerivedState extends ConversationsState {
  isStreaming: boolean; // Derived from streamingMessage !== ''
}

// Action types
type ConversationsAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_CURRENT_SESSION_ID'; payload: string | null }
  | { type: 'SET_CHAT_TYPE'; payload: ChatType }
  | { type: 'SET_TONE'; payload: ToneType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING_MESSAGE'; payload: string }
  | { type: 'SET_LOADING_CONVERSATIONS'; payload: boolean }
  | { type: 'UPDATE_CONVERSATION_TITLE'; payload: { id: string; title: string } }
  | { type: 'REMOVE_CONVERSATION'; payload: string }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_MESSAGE_FEEDBACK'; payload: { messageId: string; feedback: FeedbackType | undefined } };

// Initial state
const initialState: ConversationsState = {
  conversations: [],
  messages: [],
  currentSessionId: null,
  chatType: 'normativa_nacional',
  tone: 'default',
  isLoading: false,
  streamingMessage: '',
  isLoadingConversations: true,
};

// Reducer
function conversationsReducer(state: ConversationsState, action: ConversationsAction): ConversationsState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'SET_CURRENT_SESSION_ID':
      return { ...state, currentSessionId: action.payload };

    case 'SET_CHAT_TYPE':
      return { ...state, chatType: action.payload };
    
    case 'SET_TONE':
      return { ...state, tone: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_STREAMING_MESSAGE':
      return { ...state, streamingMessage: action.payload };
    
    case 'SET_LOADING_CONVERSATIONS':
      return { ...state, isLoadingConversations: action.payload };

    case 'UPDATE_CONVERSATION_TITLE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, title: action.payload.title }
            : conv
        ),
        // currentConversation removed - no need to update duplicate
      };
    
    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        // Clear messages - URL navigation will reload if needed
        messages: [],
      };
    
    case 'ADD_CONVERSATION':
      // Only add if not already in the list (prevents duplicates)
      const exists = state.conversations.some(conv => conv.id === action.payload.id);
      if (exists) {
        return state;
      }
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };
    
    case 'SET_MESSAGE_FEEDBACK':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, feedback: action.payload.feedback }
            : msg
        ),
        // currentConversation removed - no duplicate to update ✅
      };
    
    default:
      return state;
  }
}

// Context interface
interface ConversationsContextType {
  state: ConversationsDerivedState;

  // Actions
  loadConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  selectEmptyConversation: () => void;
  sendMessage: (content: string, currentConversationId: string | null, files?: File[]) => Promise<void>;
  stopStreaming: () => void;
  archiveConversation: (conversation: Conversation) => Promise<void>;
  deleteConversation: (conversation: Conversation) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  setChatType: (chatType: ChatType) => void;
  setTone: (tone: ToneType) => void;
  submitFeedback: (messageId: string, feedbackType: FeedbackType) => Promise<void>;
  removeFeedback: (messageId: string) => Promise<void>;
}

// Context
const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

// Provider component
export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationsReducer, initialState);
  const api = useApi();
  const hasLoadedConversations = useRef(false);
  const isLoadingConversationRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const streamingContentRef = useRef('');
  const normaIdsRef = useRef<number[] | undefined>(undefined);
  const currentToneRef = useRef<ToneType>(state.tone);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync ref with state changes
  useEffect(() => {
    currentToneRef.current = state.tone;
  }, [state.tone]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: true });
      const PAGE_SIZE = 20;
      const data = await ConversationsAPI.getConversations({ limit: PAGE_SIZE, offset: 0 });
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.items });
      offsetRef.current = data.items.length;
      hasMoreRef.current = data.has_more;
    } catch (error) {
      toast.error('Error loading conversations');
      console.error(error);
    } finally {
      isLoadingRef.current = false;
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: false });
    }
  }, []);

  // Load more conversations (pagination)
  const loadMoreConversations = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    try {
      isLoadingMoreRef.current = true;
      const PAGE_SIZE = 20;
      const data = await ConversationsAPI.getConversations({ limit: PAGE_SIZE, offset: offsetRef.current });
      if (data.items.length > 0) {
        // Filter out duplicates by ID before merging
        const existingIds = new Set(state.conversations.map(conv => conv.id));
        const newItems = data.items.filter(item => !existingIds.has(item.id));
        
        if (newItems.length > 0) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: [...state.conversations, ...newItems] });
          offsetRef.current = offsetRef.current + data.items.length;
        } else {
          // All items were duplicates, but we still advance offset to prevent infinite loading
          offsetRef.current = offsetRef.current + data.items.length;
        }
      }
      hasMoreRef.current = data.has_more;
    } catch (error) {
      console.error('Error loading more conversations', error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [state.conversations]);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    // Skip if already loading this conversation
    if (isLoadingConversationRef.current) {
      return;
    }

    // Optimization: If this conversation is already loaded, skip reload
    if (state.currentSessionId === id && state.messages.length > 0) {
      return;
    }

    try {
      isLoadingConversationRef.current = true;
      // Clear messages first to show empty state while loading
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: true });

      const conversation = await ConversationsAPI.getConversation(id);

      // Process messages to extract relevant_docs from metadata
      const processedMessages = conversation.messages.map(message => {
        const relevant_docs = message.metadata?.relevant_docs as number[] | undefined;
        return {
          ...message,
          relevant_docs: relevant_docs || undefined
        };
      });

      dispatch({ type: 'SET_MESSAGES', payload: processedMessages });
      dispatch({ type: 'SET_CHAT_TYPE', payload: conversation.chat_type });
      dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: id });
    } catch (error) {
      toast.error('Error loading conversation');
      console.error(error);
    } finally {
      isLoadingConversationRef.current = false;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSessionId, state.messages.length]);

  // Select empty conversation (new conversation state)
  const selectEmptyConversation = useCallback(() => {
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: null });
    // currentConversation removed - messages is the single source
  }, []);

        // Send message
  const sendMessage = useCallback(async (
    content: string,
    currentConversationId: string | null,
    files?: File[]
  ) => {
    // Prevent sending if already streaming (derived from streamingMessage)
    if ((!content.trim() && (!files || files.length === 0)) || state.streamingMessage !== '') return;

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    // Start streaming by setting streamingMessage to empty string (not empty)
    // This will make isStreaming = true (derived from streamingMessage !== '')
    dispatch({ type: 'SET_STREAMING_MESSAGE', payload: ' ' });
    streamingContentRef.current = '';

    // Determine session_id with fallback logic:
    // 1. Use currentConversationId from URL if it's not 'new'
    // 2. Otherwise, use state.currentSessionId as fallback (for when navigation hasn't completed)
    // 3. Otherwise undefined (truly new conversation)
    const sessionId = (currentConversationId && currentConversationId !== 'new')
      ? currentConversationId
      : (state.currentSessionId || undefined);

    console.log('[sendMessage] Debug info:', {
      currentConversationId,
      'state.currentSessionId': state.currentSessionId,
      'final sessionId': sessionId,
      'messages count': state.messages.length
    });

    // Convert files to base64
    let fileAttachments: { name: string; mime_type: string; data: string }[] | undefined;
    if (files && files.length > 0) {
      fileAttachments = await Promise.all(
        files.map(async (file) => {
          return new Promise<{ name: string; mime_type: string; data: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              // Remove data:image/...;base64, prefix
              const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
              resolve({
                name: file.name,
                mime_type: file.type,
                data: base64Data,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      // Debug: log attachment summary (not contents)
      try {
        console.log('[sendMessage] Attachments summary:', fileAttachments.map(f => ({ name: f.name, mime_type: f.mime_type, dataLen: f.data.length })));
      } catch {}
    }

    try {
      await ConversationsAPI.sendMessage(
        {
          content: content.trim(),
          session_id: sessionId,
          chat_type: state.chatType,
          tone: currentToneRef.current,
          files: fileAttachments,
        },
        (chunk) => {
          // Update currentSessionId IMMEDIATELY when we receive session_id from backend
          // This allows subsequent messages to use the correct session_id even before streaming completes
          if (chunk.session_id && !state.currentSessionId) {
            console.log('[onChunk] Received session_id, updating currentSessionId immediately:', chunk.session_id);
            dispatch({ type: 'SET_CURRENT_SESSION_ID', payload: chunk.session_id });
          }

          if (chunk.content) {
            streamingContentRef.current += chunk.content;
            dispatch({ type: 'SET_STREAMING_MESSAGE', payload: streamingContentRef.current });
          }
          // Store relevant_docs when the response is complete
          if (chunk.done && chunk.norma_ids) {
            normaIdsRef.current = chunk.norma_ids;
          }
        },
        (newSessionId) => {
          // Add the completed streamed message to the messages array
          dispatch({ type: 'ADD_MESSAGE', payload: {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: streamingContentRef.current,
            tokens_used: 0,
            created_at: new Date().toISOString(),
            relevant_docs: normaIdsRef.current, // Include relevant_docs in the message
          }});

          // End streaming by clearing streamingMessage (makes isStreaming = false)
          dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
          streamingContentRef.current = '';
          normaIdsRef.current = undefined; // Clear relevant_docs for next message
          abortControllerRef.current = null;

          // If this was a new conversation, create it, add to list, and notify via callback
          if (!sessionId && newSessionId) {
            // Create a new conversation object based on the first message
            const newConversation: Conversation = {
              id: newSessionId,
              title: content.trim(), // Use full content - truncation handled by Tailwind
              chat_type: state.chatType,
              snippet: content,
              create_time: new Date().toISOString(),
              update_time: new Date().toISOString(),
              is_archived: false,
              total_tokens: 0, // This will be updated when we get the actual conversation details
            };

            // Add the new conversation to the list
            // Messages are already in state.messages, no need for ConversationDetail
            dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });

            // currentSessionId already updated in onChunk callback (no need to dispatch again)
            // Navigation is handled by page component watching currentSessionId
          }
        },
        (error) => {
          // Don't show error toast if it was aborted (user stopped it)
          if (error.name !== 'AbortError') {
            toast.error('Error sending message');
          }
          console.error(error);
          // End streaming by clearing streamingMessage (makes isStreaming = false)
          dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
          streamingContentRef.current = '';
          abortControllerRef.current = null;
        },
        abortController
      );
    } catch (error) {
      // Don't show error toast if it was aborted (user stopped it)
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Error sending message');
      }
      console.error(error);
      // End streaming by clearing streamingMessage (makes isStreaming = false)
      dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
      streamingContentRef.current = '';
      abortControllerRef.current = null;
    }
  }, [state.chatType, state.streamingMessage, state.currentSessionId]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      // If we have accumulated streaming content, save it as a message
      if (streamingContentRef.current.trim()) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: streamingContentRef.current.trim(),
          tokens_used: 0,
          created_at: new Date().toISOString(),
          relevant_docs: normaIdsRef.current,
        }});
      }
      
      // End streaming by clearing streamingMessage (makes isStreaming = false)
      dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
      streamingContentRef.current = '';
      normaIdsRef.current = undefined;
    }
  }, []);

  // Archive conversation
  const archiveConversation = useCallback(async (conversation: Conversation) => {
    try {
      await ConversationsAPI.updateConversation(conversation.id, { is_archived: true });
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
      toast.success('Conversación archivada');
    } catch (error) {
      toast.error('Error archiving conversation');
      console.error(error);
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversation: Conversation) => {
    try {
      await ConversationsAPI.deleteConversation(conversation.id);
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
      toast.success('Conversación eliminada');
    } catch (error) {
      toast.error('Error deleting conversation');
      console.error(error);
    }
  }, []);

  // Update conversation title (simplified - UI state handled in component)
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      await ConversationsAPI.updateConversation(conversationId, { title: title.trim() });
      dispatch({ type: 'UPDATE_CONVERSATION_TITLE', payload: { id: conversationId, title: title.trim() } });
      toast.success('Título actualizado');
    } catch (error) {
      toast.error('Error updating title');
      console.error(error);
    }
  }, []);

  // Set chat type
  const setChatType = useCallback((chatType: ChatType) => {
    dispatch({ type: 'SET_CHAT_TYPE', payload: chatType });
  }, []);

  // Set tone
  const setTone = useCallback((tone: ToneType) => {
    currentToneRef.current = tone; // Update ref immediately
    dispatch({ type: 'SET_TONE', payload: tone });
  }, []);

  // Submit feedback (optimistic update)
  const submitFeedback = useCallback(async (messageId: string, feedbackType: FeedbackType) => {
    // Optimistic UI update
    dispatch({ type: 'SET_MESSAGE_FEEDBACK', payload: { messageId, feedback: feedbackType } });
    // Use authenticated API client
    api.post('/api/conversations/feedback/', {
      message_id: messageId,
      feedback_type: feedbackType,
    }).catch(error => {
      console.error('Error submitting feedback:', error);
    });
  }, [api]);

  // Remove feedback (optimistic update)
  const removeFeedback = useCallback(async (messageId: string) => {
    // Optimistic UI update
    dispatch({ type: 'SET_MESSAGE_FEEDBACK', payload: { messageId, feedback: undefined } });
    // Use authenticated API client
    api.delete(`/api/conversations/feedback/${messageId}`).catch(error => {
      console.error('Error removing feedback:', error);
    });
  }, [api]);

  // Load conversations on mount
  React.useEffect(() => {
    if (!hasLoadedConversations.current) {
      hasLoadedConversations.current = true;
      loadConversations();
    }
  }, [loadConversations]);

  // Derive isStreaming from streamingMessage
  const derivedState: ConversationsDerivedState = {
    ...state,
    isStreaming: state.streamingMessage !== '',
  };

  const value: ConversationsContextType = {
    state: derivedState,
    loadConversations,
    loadMoreConversations,
    loadConversation,
    selectEmptyConversation,
    sendMessage,
    stopStreaming,
    archiveConversation,
    deleteConversation,
    updateConversationTitle,
    setChatType,
    setTone,
    submitFeedback,
    removeFeedback,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

// Hook to use the conversations context
export function useConversations() {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
}

// Optional version that returns undefined instead of throwing
export function useConversationsOptional() {
  const context = useContext(ConversationsContext);
  return context;
}