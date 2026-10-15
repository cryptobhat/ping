/**
 * API Service Layer
 * 
 * This file handles all communication with the Ping backend server.
 * It provides a clean interface for the frontend to make API calls.
 * 
 * Key features:
 * - Base URL configuration
 * - Request/response interceptors
 * - Error handling
 * - Type-safe request/response objects
 * 
 * All API calls go through axios instance with proper headers and error handling.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

// Backend API base URL
// In production, this should be your server URL
// For development, you can use localhost (Android) or 127.0.0.1 (iOS)
// But for real testing, use your computer's IP on the same network

// Uncomment the appropriate line based on your environment
// For development on physical device (both Android and iOS):
// export const API_BASE_URL = 'http://<YOUR_COMPUTER_IP>:8080/api';
// For production:
// export const API_BASE_URL = 'https://api.ping.app/api';

// For now, using a placeholder. Replace with your actual backend URL
export const API_BASE_URL = '__BACKEND_URL__'; // Replace this with your actual backend URL

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data as { message?: string; error?: string };
      
      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        useAuthStore.getState().logout();
        // You might want to navigate to login screen here
        // For now, just return the error
      }
      
      // Add custom error message from backend if available
      if (data?.message) {
        error.message = data.message;
      } else if (data?.error) {
        error.message = data.error;
      }
    } else if (error.request) {
      // The request was made but no response was received
      error.message = 'No response from server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      error.message = 'Request setup error';
    }
    
    return Promise.reject(error);
  }
);

// Type definitions for API responses

// Generic response wrapper used by backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Error response
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// Authentication endpoints

export interface SendOtpRequest {
  phone: string; // Phone number with country code (e.g., +919876543210)
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  requestId?: string; // For tracking OTP verification
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  requestId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    profilePic?: string;
    createdAt: string;
  };
}

export interface RegisterUserRequest {
  phone: string;
  name: string;
  profilePic?: string; // Base64 encoded or URL
}

export interface RegisterUserResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    phone: string;
    name: string;
    profilePic?: string;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  profilePic?: string; // Base64 encoded or URL
}

export interface UpdateProfileResponse {
  success: boolean;
  user: {
    id: string;
    phone: string;
    name: string;
    profilePic?: string;
  };
}

// Message types
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'file';

export interface MessageRequest {
  conversationId: string;
  content: string;
  type: MessageType;
  // For media
  mediaUrl?: string;
  thumbnailUrl?: string;
  // For location
  latitude?: number;
  longitude?: number;
  locationName?: string;
  // For voice
  duration?: number;
  // For file
  fileName?: string;
  fileSize?: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    phone: string;
    name: string;
    profilePic?: string;
  };
  content: string;
  type: MessageType;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isEncrypted: boolean;
  timestamp: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  duration?: number;
  fileName?: string;
  fileSize?: number;
}

// Conversation types
export interface ConversationResponse {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: Array<{
    id: string;
    phone: string;
    name: string;
    profilePic?: string;
    isOnline?: boolean;
  }>;
  lastMessage?: MessageResponse;
  unreadCount: number;
  createdBy?: string;
  createdAt?: string;
  groupPic?: string;
}

// Group types
export interface CreateGroupRequest {
  name: string;
  participantPhones: string[]; // Array of phone numbers to add to group
}

export interface CreateGroupResponse {
  success: boolean;
  conversation: ConversationResponse;
}

export interface AddToGroupRequest {
  conversationId: string;
  participantPhones: string[];
}

export interface AddToGroupResponse {
  success: boolean;
  conversation: ConversationResponse;
}

// Contact types
export interface Contact {
  id: string;
  phone: string;
  name: string;
  profilePic?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// API Functions

// ====================
// Authentication
// ====================

/**
 * Send OTP to user's phone number
 * This triggers MessageCentral to send SMS with OTP code
 */
export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  const response = await api.post<ApiResponse<SendOtpResponse>>('/auth/send-otp', {
    phone,
  });
  return response.data.data;
};

/**
 * Verify OTP and login user
 * After successful verification, returns user data and auth token
 */
export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  const response = await api.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', {
    phone,
    otp,
  });
  return response.data.data;
};

/**
 * Register new user after OTP verification
 * Only needed for first-time users
 */
export const registerUser = async (data: RegisterUserRequest): Promise<RegisterUserResponse> => {
  const response = await api.post<ApiResponse<RegisterUserResponse>>('/auth/register', data);
  return response.data.data;
};

/**
 * Update user profile (name, profile picture)
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
  const response = await api.put<ApiResponse<UpdateProfileResponse>>('/user/profile', data);
  return response.data.data;
};

/**
 * Upload profile picture
 * Returns URL of uploaded image
 */
export const uploadProfilePic = async (imageUri: string, imageName: string): Promise<string> => {
  // For Expo, we need to create FormData
  const formData = new FormData();
  
  // On iOS/Android, the URI looks like: file:///path/to/image.jpg
  // We need to extract just the filename
  const filename = imageUri.split('/').pop() || imageName;
  
  // Create file object from URI
  const file = {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    type: 'image/jpeg', // or image/png based on your image
    name: filename,
  } as unknown as Blob;
  
  formData.append('file', file);
  
  const response = await api.post<ApiResponse<{ url: string }>>('/upload/profile-pic', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data.url;
};

// ====================
// Conversations
// ====================

/**
 * Get all conversations for current user
 */
export const getConversations = async (): Promise<ConversationResponse[]> => {
  const response = await api.get<ApiResponse<ConversationResponse[]>>('/conversations');
  return response.data.data;
};

/**
 * Get single conversation by ID
 */
export const getConversation = async (id: string): Promise<ConversationResponse> => {
  const response = await api.get<ApiResponse<ConversationResponse>>(`/conversations/${id}`);
  return response.data.data;
};

/**
 * Create new 1-to-1 conversation with another user
 */
export const createConversation = async (participantPhone: string): Promise<ConversationResponse> => {
  const response = await api.post<ApiResponse<ConversationResponse>>('/conversations', {
    participantPhone,
  });
  return response.data.data;
};

/**
 * Delete conversation
 */
export const deleteConversation = async (id: string): Promise<{ success: boolean }> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(`/conversations/${id}`);
  return response.data.data;
};

// ====================
// Groups
// ====================

/**
 * Create new group
 */
export const createGroup = async (data: CreateGroupRequest): Promise<CreateGroupResponse> => {
  const response = await api.post<ApiResponse<CreateGroupResponse>>('/groups', data);
  return response.data.data;
};

/**
 * Add participants to group
 */
export const addToGroup = async (data: AddToGroupRequest): Promise<AddToGroupResponse> => {
  const response = await api.post<ApiResponse<AddToGroupResponse>>('/groups/add-participants', data);
  return response.data.data;
};

/**
 * Remove participant from group
 */
export const removeFromGroup = async (conversationId: string, participantId: string): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/groups/remove-participant', {
    conversationId,
    participantId,
  });
  return response.data.data;
};

/**
 * Leave group
 */
export const leaveGroup = async (conversationId: string): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/groups/leave', {
    conversationId,
  });
  return response.data.data;
};

/**
 * Update group name and/or picture
 */
export const updateGroup = async (conversationId: string, name?: string, groupPic?: string): Promise<ConversationResponse> => {
  const response = await api.put<ApiResponse<ConversationResponse>>(`/groups/${conversationId}`, {
    name,
    groupPic,
  });
  return response.data.data;
};

/**
 * Get group invite link
 */
export const getGroupInviteLink = async (conversationId: string): Promise<{ link: string }> => {
  const response = await api.get<ApiResponse<{ link: string }>>(`/groups/${conversationId}/invite-link`);
  return response.data.data;
};

/**
 * Join group via invite link
 */
export const joinGroup = async (inviteLink: string): Promise<ConversationResponse> => {
  const response = await api.post<ApiResponse<ConversationResponse>>('/groups/join', {
    inviteLink,
  });
  return response.data.data;
};

// ====================
// Messages
// ====================

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string, limit?: number, offset?: number): Promise<MessageResponse[]> => {
  const params: { conversationId: string; limit?: number; offset?: number } = {
    conversationId,
  };
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  
  const response = await api.get<ApiResponse<MessageResponse[]>>('/messages', { params });
  return response.data.data;
};

/**
 * Send message in conversation
 */
export const sendMessage = async (data: MessageRequest): Promise<MessageResponse> => {
  const response = await api.post<ApiResponse<MessageResponse>>('/messages', data);
  return response.data.data;
};

/**
 * Update message status (e.g., mark as read)
 */
export const updateMessageStatus = async (messageId: string, status: 'read' | 'delivered'): Promise<MessageResponse> => {
  const response = await api.put<ApiResponse<MessageResponse>>(`/messages/${messageId}/status`, {
    status,
  });
  return response.data.data;
};

/**
 * Delete message
 */
export const deleteMessage = async (messageId: string): Promise<{ success: boolean }> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(`/messages/${messageId}`);
  return response.data.data;
};

/**
 * Upload media file (image, video, voice note, etc.)
 * Returns URL of uploaded file
 */
export const uploadMedia = async (fileUri: string, fileName: string, type: 'image' | 'video' | 'voice' | 'file'): Promise<string> => {
  const formData = new FormData();
  
  const file = {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    type: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/mpeg',
    name: fileName,
  } as unknown as Blob;
  
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await api.post<ApiResponse<{ url: string }>>('/upload/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data.url;
};

// ====================
// Contacts
// ====================

/**
 * Get user's contacts who are also on Ping
 */
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<ApiResponse<Contact[]>>('/contacts');
  return response.data.data;
};

/**
 * Search for users by phone number or name
 */
export const searchUsers = async (query: string): Promise<Contact[]> => {
  const response = await api.get<ApiResponse<Contact[]>>('/users/search', {
    params: { query },
  });
  return response.data.data;
};

// ====================
// Account Management
// ====================

/**
 * Logout current user
 */
export const logout = async (): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/auth/logout');
  return response.data.data;
};

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<{ success: boolean }> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>('/user');
  return response.data.data;
};

/**
 * Report user or message
 */
export const report = async (type: 'user' | 'message', id: string, reason: string): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/report', {
    type,
    id,
    reason,
  });
  return response.data.data;
};

/**
 * Block user
 */
export const blockUser = async (userId: string): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/user/block', {
    userId,
  });
  return response.data.data;
};

/**
 * Unblock user
 */
export const unblockUser = async (userId: string): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/user/unblock', {
    userId,
  });
  return response.data.data;
};

// ====================
// Presence & Status
// ====================

/**
 * Update online status
 */
export const updatePresence = async (isOnline: boolean): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/presence', {
    isOnline,
  });
  return response.data.data;
};

/**
 * Set last seen privacy
 */
export const setLastSeenPrivacy = async (privacy: 'everyone' | 'contacts' | 'nobody'): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/privacy/last-seen', {
    privacy,
  });
  return response.data.data;
};

// ====================
// Notifications
// ====================

/**
 * Register for push notifications
 * This sends the device token to the backend
 */
export const registerPushToken = async (token: string, platform: 'ios' | 'android'): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/notifications/register', {
    token,
    platform,
  });
  return response.data.data;
};

/**
 * Enable/disable push notifications
 */
export const setPushNotifications = async (enabled: boolean): Promise<{ success: boolean }> => {
  const response = await api.post<ApiResponse<{ success: boolean }>>('/notifications/settings', {
    enabled,
  });
  return response.data.data;
};

export default api;
