/**
 * Chat Store - Manages chat-related state
 * 
 * This store keeps track of:
 * - All conversations (1-to-1 and groups)
 * - Messages for each conversation
 * - Current active conversation
 * - Unread message counts
 * - Online/offline status of contacts
 * 
 * The data is organized by conversation ID for efficient lookups.
 */

import { create } from 'zustand';

// Types for chat data

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'location' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  isEncrypted: boolean;
  // For media messages
  mediaUrl?: string;
  thumbnailUrl?: string;
  // For location messages
  latitude?: number;
  longitude?: number;
  locationName?: string;
  // For voice messages
  duration?: number; // in seconds
  // For file messages
  fileName?: string;
  fileSize?: number;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: Participant[];
  lastMessage?: Message;
  lastMessageTime?: Date;
  unreadCount: number;
  // For groups
  createdBy?: string;
  createdAt?: Date;
  groupPic?: string;
  // For private conversations
  otherUser?: Participant;
}

export interface Participant {
  id: string;
  phone: string;
  name: string;
  profilePic?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface ChatState {
  // All conversations, indexed by ID
  conversations: Record<string, Conversation>;
  
  // All messages, indexed by conversation ID
  messages: Record<string, Message[]>;
  
  // Currently selected conversation ID (null if none)
  activeConversationId: string | null;
  
  // Loading states
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Error state
  error: string | null;
  
  // Search query for conversations
  searchQuery: string;
}

interface ChatActions {
  // Initialize conversations list
  setConversations: (conversations: Conversation[]) => void;
  
  // Add a new conversation
  addConversation: (conversation: Conversation) => void;
  
  // Update a conversation (e.g., name, participants)
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  
  // Remove a conversation
  removeConversation: (id: string) => void;
  
  // Set active conversation
  setActiveConversation: (id: string | null) => void;
  
  // Initialize messages for a conversation
  setMessages: (conversationId: string, messages: Message[]) => void;
  
  // Add a new message to a conversation
  addMessage: (message: Message) => void;
  
  // Update a message (e.g., status from 'sending' to 'sent')
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Add multiple messages at once
  addMessages: (conversationId: string, messages: Message[]) => void;
  
  // Set loading states
  setLoadingConversations: (isLoading: boolean) => void;
  setLoadingMessages: (isLoading: boolean) => void;
  setSendingMessage: (isSending: boolean) => void;
  
  // Set error
  setError: (error: string | null) => void;
  
  // Set search query
  setSearchQuery: (query: string) => void;
  
  // Mark conversation as read
  markAsRead: (conversationId: string) => void;
  
  // Clear all chat data (useful for logout)
  clearChat: () => void;
  
  // Get conversation by ID
  getConversation: (id: string) => Conversation | undefined;
  
  // Get messages for a conversation
  getMessages: (conversationId: string) => Message[];
  
  // Get unread count for a conversation
  getUnreadCount: (conversationId: string) => number;
}

const initialState: ChatState = {
  conversations: {},
  messages: {},
  activeConversationId: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  error: null,
  searchQuery: '',
};

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  // Initial state
  ...initialState,
  
  // Actions
  setConversations: (conversations) => {
    // Convert array to object indexed by ID
    const conversationsObj = conversations.reduce((acc, conv) => {
      acc[conv.id] = conv;
      return acc;
    }, {} as Record<string, Conversation>);
    
    set({ conversations: conversationsObj, isLoadingConversations: false });
  },
  
  addConversation: (conversation) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversation.id]: conversation,
      },
    }));
  },
  
  updateConversation: (id, updates) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [id]: {
          ...state.conversations[id],
          ...updates,
        },
      },
    }));
  },
  
  removeConversation: (id) => {
    set((state) => {
      const newConversations = { ...state.conversations };
      delete newConversations[id];
      
      // Also remove messages for this conversation
      const newMessages = { ...state.messages };
      delete newMessages[id];
      
      // Clear active conversation if it was this one
      const newActiveId = state.activeConversationId === id ? null : state.activeConversationId;
      
      return {
        conversations: newConversations,
        messages: newMessages,
        activeConversationId: newActiveId,
      };
    });
  },
  
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    // Mark as read when conversation becomes active
    if (id) {
      get().markAsRead(id);
    }
  },
  
  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
      isLoadingMessages: false,
    }));
  },
  
  addMessage: (message) => {
    set((state) => {
      const conversationId = message.conversationId;
      const existingMessages = state.messages[conversationId] || [];
      
      // Check if message already exists (avoid duplicates)
      const exists = existingMessages.some(m => m.id === message.id);
      if (exists) {
        return state;
      }
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
        // Update last message in conversation
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            lastMessage: message,
            lastMessageTime: message.timestamp,
          },
        },
      };
    });
  },
  
  addMessages: (conversationId, messages) => {
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const messageIds = new Set(existingMessages.map(m => m.id));
      
      // Only add new messages (filter out duplicates)
      const newMessages = messages.filter(m => !messageIds.has(m.id));
      
      if (newMessages.length === 0) {
        return state;
      }
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, ...newMessages],
        },
      };
    });
  },
  
  updateMessage: (conversationId, messageId, updates) => {
    set((state) => {
      const conversationMessages = state.messages[conversationId];
      if (!conversationMessages) {
        return state;
      }
      
      const updatedMessages = conversationMessages.map(m =>
        m.id === messageId ? { ...m, ...updates } : m
      );
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
      };
    });
  },
  
  setLoadingConversations: (isLoading) => {
    set({ isLoadingConversations: isLoading });
  },
  
  setLoadingMessages: (isLoading) => {
    set({ isLoadingMessages: isLoading });
  },
  
  setSendingMessage: (isSending) => {
    set({ isSendingMessage: isSending });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  markAsRead: (conversationId) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          ...state.conversations[conversationId],
          unreadCount: 0,
        },
      },
    }));
  },
  
  clearChat: () => {
    set(initialState);
  },
  
  // Selectors
  getConversation: (id) => {
    return get().conversations[id];
  },
  
  getMessages: (conversationId) => {
    return get().messages[conversationId] || [];
  },
  
  getUnreadCount: (conversationId) => {
    const conversation = get().conversations[conversationId];
    return conversation?.unreadCount || 0;
  },
}));

// Convenient selector hooks
export const useConversations = () => useChatStore((state) => state.conversations);
export const useMessages = (conversationId: string) => 
  useChatStore((state) => state.messages[conversationId] || []);
export const useActiveConversationId = () => useChatStore((state) => state.activeConversationId);
export const useActiveConversation = () => {
  const activeId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  return activeId ? conversations[activeId] : null;
};
export const useIsLoadingConversations = () => useChatStore((state) => state.isLoadingConversations);
export const useIsLoadingMessages = () => useChatStore((state) => state.isLoadingMessages);
export const useChatError = () => useChatStore((state) => state.error);
export const useSearchQuery = () => useChatStore((state) => state.searchQuery);
