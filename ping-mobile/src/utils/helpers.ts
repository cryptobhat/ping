/**
 * Helper Functions
 * 
 * This file contains utility functions used throughout the app.
 * These are small, reusable functions that don't belong in any specific feature.
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';

// Get device screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Format phone number for display
 * Removes country code and adds spaces for readability
 * 
 * Example: +919876543210 -> 98765 43210
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove country code (+91, +1, etc.)
  let formatted = phone.replace(/^\+\d{1,3}/, '');
  
  // Add space every 5 digits for readability
  if (formatted.length > 5) {
    formatted = `${formatted.slice(0, 5)} ${formatted.slice(5)}`;
  }
  
  return formatted;
};

/**
 * Format phone number for international display
 * Keeps country code and formats the rest
 * 
 * Example: +919876543210 -> +91 98765 43210
 */
export const formatInternationalPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Extract country code
  const countryCodeMatch = phone.match(/^\+(\d{1,3})/);
  const countryCode = countryCodeMatch ? countryCodeMatch[1] : '';
  
  // Extract rest of the number
  const rest = phone.replace(/^\+\d{1,3}/, '');
  
  // Format the rest
  let formattedRest = rest;
  if (rest.length > 5) {
    formattedRest = `${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  
  return countryCode ? `+${countryCode} ${formattedRest}` : formattedRest;
};

/**
 * Format timestamp for chat messages
 * Shows time if same day, otherwise shows date
 * 
 * Example: 
 * - 2 minutes ago -> "2m"
 * - 2 hours ago on same day -> "2:30 PM"
 * - Yesterday -> "Yesterday"
 * - Older -> "Jan 15"
 */
export const formatMessageTime = (date: Date | string): string => {
  const now = new Date();
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);
  
  // Less than 1 minute
  if (diffInMins < 1) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diffInMins < 60) {
    return `${diffInMins}m`;
  }
  
  // Same day, less than 24 hours
  if (diffInHours < 24) {
    // Format as HH:MM AM/PM
    return messageDate.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  // Same week
  if (diffInDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  }
  
  // Older than a week
  return messageDate.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format file size to human readable string
 * 
 * Example: 
 * - 1024 -> "1 KB"
 * - 1048576 -> "1 MB"
 * - 1073741824 -> "1 GB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format voice message duration
 * 
 * Example: 
 * - 45 seconds -> "0:45"
 * - 125 seconds -> "2:05"
 * - 3661 seconds -> "1:01:01"
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Truncate text to max length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Get initials from name for avatar fallback
 * 
 * Example: 
 * - "John Doe" -> "JD"
 * - "Alice" -> "A"
 * - "" -> "?"
 */
export const getInitials = (name: string, fallback = '?'): string => {
  if (!name) return fallback;
  
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return fallback;
  
  // First word first letter
  let initials = words[0][0].toUpperCase();
  
  // Second word first letter if exists
  if (words.length > 1) {
    initials += words[1][0].toUpperCase();
  }
  
  return initials;
};

/**
 * Generate unique ID for temporary use (e.g., for messages before they're sent)
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Check if string is valid phone number
 * Simple validation - at least 8 digits, can have country code
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must have at least 8 digits
  const digits = cleaned.replace(/\D/g, '');
  
  return digits.length >= 8;
};

/**
 * Check if string is valid OTP (6 digits)
 */
export const isValidOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/**
 * Check if string is valid name (2-50 characters, letters, spaces, hyphens)
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 50) return false;
  return /^[a-zA-Z\s\-']+$/.test(name);
};

/**
 * Debounce function to limit how often a function can be called
 * Useful for search inputs to prevent too many API calls
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
};

/**
 * Sleep function - returns a promise that resolves after specified milliseconds
 * Useful for async operations and delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Convert file URI to blob (for file uploads)
 * Expo-specific helper
 */
export const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

/**
 * Get time ago string for last seen
 * 
 * Example: 
 * - 2 minutes ago -> "2m ago"
 * - 2 hours ago -> "2h ago"
 * - Yesterday -> "Yesterday"
 * - Older -> "3d ago"
 */
export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffInMs = now.getTime() - pastDate.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);
  
  if (diffInMins < 1) {
    return 'Online';
  }
  
  if (diffInMins < 60) {
    return `${diffInMins}m ago`;
  }
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return pastDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

/**
 * Get conversation name based on type and participants
 * For private chats: show contact name
 * For groups: show group name or participant count
 */
export const getConversationName = (
  type: 'private' | 'group',
  name: string,
  participants: Array<{ name: string }>,
  currentUserName?: string
): string => {
  if (type === 'group') {
    return name || `${participants.length} members`;
  }
  
  // For private, show the other participant's name
  if (participants.length === 2 && name) {
    return name;
  }
  
  // Fallback
  return name || 'Chat';
};

/**
 * Get conversation avatar based on type and participants
 * For private chats: show contact profile pic or initials
 * For groups: show group pic or initials of group name
 */
export const getConversationAvatar = (
  type: 'private' | 'group',
  name: string,
  participants: Array<{ profilePic?: string; name: string }>,
  groupPic?: string
): { uri?: string; initials: string } => {
  if (type === 'group') {
    if (groupPic) {
      return { uri: groupPic, initials: '' };
    }
    return { initials: getInitials(name) };
  }
  
  // For private, show the other participant's pic or initials
  const otherParticipant = participants.find(p => p.name !== name);
  if (otherParticipant) {
    if (otherParticipant.profilePic) {
      return { uri: otherParticipant.profilePic, initials: '' };
    }
    return { initials: getInitials(otherParticipant.name) };
  }
  
  return { initials: getInitials(name) };
};
