/**
 * WebSocket Hook
 * 
 * This hook manages the WebSocket connection to the backend for real-time features:
 * - Receiving messages instantly
 * - Getting online/offline status updates
 * - Typing indicators
 * - Message read receipts
 * 
 * The WebSocket connection is maintained throughout the user's session.
 * It automatically reconnects if the connection is lost.
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Message } from '../store/chatStore';

// WebSocket URL - replace with your backend WebSocket URL
// For development: ws://<YOUR_COMPUTER_IP>:8080/ws
// For production: wss://api.ping.app/ws
const WS_URL = '__BACKEND_WS_URL__'; // Replace with your actual WebSocket URL

// Message types that can be received from WebSocket
type WebSocketMessageType = 
  | 'new_message'
  | 'message_read'
  | 'message_delivered'
  | 'user_online'
  | 'user_offline'
  | 'typing_start'
  | 'typing_stop'
  | 'new_conversation'
  | 'group_updated'
  | 'error';

interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

interface TypingState {
  [conversationId: string]: {
    [userId: string]: boolean;
  };
}

interface OnlineState {
  [userId: string]: boolean;
}

export const useWebSocket = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [typing, setTyping] = useState<TypingState>({});
  const [onlineStatus, setOnlineStatus] = useState<OnlineState>({});
  
  // Maximum reconnection attempts before giving up (temporarily)
  const MAX_RECONNECT_ATTEMPTS = 5;
  // Reconnect delay in milliseconds
  const RECONNECT_DELAY = 3000;
  
  /**
   * Connect to WebSocket server
   * Adds auth token to connection URL
   */
  const connect = () => {
    // Don't connect if we don't have a token
    if (!token || !user) {
      disconnect();
      return;
    }
    
    // Close existing connection if any
    disconnect();
    
    // Create new WebSocket connection with auth token
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
      }));
    };
    
    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect if we have a token
      if (token && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
      }
    };
    
    ws.onerror = (error) => {
      console.log('[WebSocket] Error', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message', error);
      }
    };
  };
  
  /**
   * Schedule reconnection attempt
   */
  const scheduleReconnect = () => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
    }
    
    setReconnectAttempts(prev => prev + 1);
    
    reconnectIntervalRef.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  };
  
  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_message':
        handleNewMessage(message.data);
        break;
      case 'message_read':
        handleMessageRead(message.data);
        break;
      case 'message_delivered':
        handleMessageDelivered(message.data);
        break;
      case 'user_online':
        handleUserOnline(message.data);
        break;
      case 'user_offline':
        handleUserOffline(message.data);
        break;
      case 'typing_start':
        handleTypingStart(message.data);
        break;
      case 'typing_stop':
        handleTypingStop(message.data);
        break;
      case 'new_conversation':
        handleNewConversation(message.data);
        break;
      case 'group_updated':
        handleGroupUpdated(message.data);
        break;
      case 'error':
        console.error('[WebSocket] Error message:', message.data);
        break;
      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  };
  
  /**
   * Handle new message received
   */
  const handleNewMessage = (data: any) => {
    const message: Message = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.sender?.name || 'Unknown',
      senderPhone: data.sender?.phone || '',
      content: data.content,
      type: data.type,
      status: 'delivered',
      timestamp: new Date(data.timestamp),
      isEncrypted: data.isEncrypted || false,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName,
      duration: data.duration,
      fileName: data.fileName,
      fileSize: data.fileSize,
    };
    
    addMessage(message);
  };
  
  /**
   * Handle message read receipt
   */
  const handleMessageRead = (data: any) => {
    const { conversationId, messageId } = data;
    updateMessage(conversationId, messageId, { status: 'read' });
  };
  
  /**
   * Handle message delivered receipt
   */
  const handleMessageDelivered = (data: any) => {
    const { conversationId, messageId } = data;
    updateMessage(conversationId, messageId, { status: 'delivered' });
  };
  
  /**
   * Handle user online status
   */
  const handleUserOnline = (data: any) => {
    setOnlineStatus(prev => ({
      ...prev,
      [data.userId]: true,
    }));
  };
  
  /**
   * Handle user offline status
   */
  const handleUserOffline = (data: any) => {
    setOnlineStatus(prev => ({
      ...prev,
      [data.userId]: false,
    }));
  };
  
  /**
   * Handle typing start event
   */
  const handleTypingStart = (data: any) => {
    const { conversationId, userId } = data;
    setTyping(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        [userId]: true,
      },
    }));
  };
  
  /**
   * Handle typing stop event
   */
  const handleTypingStop = (data: any) => {
    const { conversationId, userId } = data;
    setTyping(prev => {
      const convTyping = prev[conversationId];
      if (convTyping && convTyping[userId]) {
        const newConvTyping = { ...convTyping };
        delete newConvTyping[userId];
        return {
          ...prev,
          [conversationId]: newConvTyping,
        };
      }
      return prev;
    });
  };
  
  /**
   * Handle new conversation created
   */
  const handleNewConversation = (data: any) => {
    addConversation(data.conversation);
  };
  
  /**
   * Handle group update
   */
  const handleGroupUpdated = (data: any) => {
    updateConversation(data.conversation.id, data.updates);
  };
  
  /**
   * Send message via WebSocket
   * Used for real-time communication
   */
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  /**
   * Send typing indicator
   * Let others know this user is typing
   */
  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        conversationId,
        userId: user?.id,
      }));
    }
  };
  
  /**
   * Send message read receipt
   * Let sender know we read their message
   */
  const sendMessageRead = (conversationId: string, messageId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message_read',
        conversationId,
        messageId,
        userId: user?.id,
      }));
    }
  };
  
  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };
  
  // Connect/disconnect when token changes
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [token]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);
  
  /**
   * Check if a specific user is currently typing in a conversation
   */
  const isUserTyping = (conversationId: string, userId: string): boolean => {
    return typing[conversationId]?.[userId] || false;
  };
  
  /**
   * Check if any user is typing in a conversation
   */
  const isAnyoneTyping = (conversationId: string): boolean => {
    const conversationTyping = typing[conversationId];
    if (!conversationTyping) return false;
    return Object.keys(conversationTyping).length > 0;
  };
  
  /**
   * Get list of users currently typing in a conversation
   */
  const getTypingUsers = (conversationId: string): string[] => {
    const conversationTyping = typing[conversationId];
    if (!conversationTyping) return [];
    return Object.keys(conversationTyping);
  };
  
  /**
   * Check if a user is currently online
   */
  const isUserOnline = (userId: string): boolean => {
    return onlineStatus[userId] || false;
  };
  
  return {
    isConnected,
    reconnectAttempts,
    isUserTyping,
    isAnyoneTyping,
    getTypingUsers,
    isUserOnline,
    sendMessage,
    sendTyping,
    sendMessageRead,
    disconnect,
    connect,
  };
};
