'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ConversationsAPI, type Message, type Conversation, type ChatType, type FeedbackType, type ToneType } from '../index';

// State interface
interface ConversationsState {
  conversations: Conversation[];
  // currentConversation removed - was duplicating messages array
  messages: Message[];
  // currentSessionId removed - use URL as single source of truth
  chatType: ChatType;
  tone: ToneType;
  isLoading: boolean;
  // isStreaming removed - derived from streamingMessage !== ''
  streamingMessage: string;
  isLoadingConversations: boolean;
  // editingConversationId removed - moved to local state in conversations-page
  // tempTitle removed - moved to local state in conversations-page
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
  loadConversation: (id: string) => Promise<void>;
  selectEmptyConversation: () => void;
  sendMessage: (content: string, currentConversationId: string | null, onNewConversation?: (sessionId: string) => void) => Promise<void>;
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
  const hasLoadedConversations = useRef(false);
  const isLoadingRef = useRef(false);
  const streamingContentRef = useRef('');
  const normaIdsRef = useRef<number[] | undefined>(undefined);
  const currentToneRef = useRef<ToneType>(state.tone);

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
      const data = await ConversationsAPI.getConversations();
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.items });
    } catch (error) {
      toast.error('Error loading conversations');
      console.error(error);
    } finally {
      isLoadingRef.current = false;
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: false });
    }
  }, []);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    try {
      // Clear messages first to show empty state while loading
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: true });

      const conversation = await ConversationsAPI.getConversation(id);

      // Process messages to extract relevant_docs from metadata
      const processedMessages = conversation.messages.map(message => {
        // Extract relevant_docs from metadata if available
        const relevant_docs = message.metadata?.relevant_docs as number[] | undefined;
        return {
          ...message,
          relevant_docs: relevant_docs || undefined
        };
      });

      dispatch({ type: 'SET_MESSAGES', payload: processedMessages });
      dispatch({ type: 'SET_CHAT_TYPE', payload: conversation.chat_type });
      // currentConversation removed - messages is the single source
    } catch (error) {
      toast.error('Error loading conversation');
      console.error(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Select empty conversation (new conversation state)
  const selectEmptyConversation = useCallback(() => {
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    // currentConversation removed - messages is the single source
  }, []);

        // Send message
  const sendMessage = useCallback(async (
    content: string,
    currentConversationId: string | null,
    onNewConversation?: (sessionId: string) => void
  ) => {
    // Prevent sending if already streaming (derived from streamingMessage)
    if (!content.trim() || state.streamingMessage !== '') return;

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

    // Determine session_id: use currentConversationId if it's not 'new', otherwise undefined
    const sessionId = (currentConversationId && currentConversationId !== 'new')
      ? currentConversationId
      : undefined;

    try {
      await ConversationsAPI.sendMessage(
        {
          content: content.trim(),
          session_id: sessionId,
          chat_type: state.chatType,
          tone: currentToneRef.current,
        },
        (chunk) => {
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

            // Call navigation callback to update URL
            if (onNewConversation) {
              onNewConversation(newSessionId);
            }
          }
        },
        (error) => {
          toast.error('Error sending message');
          console.error(error);
          // End streaming by clearing streamingMessage (makes isStreaming = false)
          dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
          streamingContentRef.current = '';
        }
      );
    } catch (error) {
      toast.error('Error sending message');
      console.error(error);
      // End streaming by clearing streamingMessage (makes isStreaming = false)
      dispatch({ type: 'SET_STREAMING_MESSAGE', payload: '' });
      streamingContentRef.current = '';
    }
  }, [state.chatType, state.streamingMessage]);

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
    // Update UI immediately (optimistic)
    dispatch({ type: 'SET_MESSAGE_FEEDBACK', payload: { messageId, feedback: feedbackType } });
    
    // Send request in background, don't wait for response
    ConversationsAPI.createOrUpdateFeedback(messageId, feedbackType).catch(error => {
      console.error('Error submitting feedback:', error);
      // Silently fail - user already sees the feedback as successful
    });
  }, []);

  // Remove feedback (optimistic update)
  const removeFeedback = useCallback(async (messageId: string) => {
    // Update UI immediately (optimistic)
    dispatch({ type: 'SET_MESSAGE_FEEDBACK', payload: { messageId, feedback: undefined } });
    
    // Send request in background, don't wait for response
    ConversationsAPI.deleteFeedback(messageId).catch(error => {
      console.error('Error removing feedback:', error);
      // Silently fail - user already sees the feedback as removed
    });
  }, []);

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
    loadConversation,
    selectEmptyConversation,
    sendMessage,
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