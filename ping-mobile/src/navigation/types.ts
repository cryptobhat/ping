/**
 * Navigation Types
 * 
 * This file defines all the screen names and parameters used in the app's navigation.
 * Using a centralized type definition ensures type safety when navigating between screens.
 */

// Authentication stack screens
export type AuthStackParamList = {
  // Initial screen - user enters phone number
  PhoneInput: undefined;
  
  // OTP verification screen
  OtpVerification: {
    phone: string; // Phone number entered by user
  };
  
  // Profile setup for new users
  ProfileSetup: {
    phone: string;
    isNewUser: boolean;
  };
};

// Main app stack screens
export type MainStackParamList = {
  // Home screen with chat list
  Home: undefined;
  
  // Individual chat screen
  Chat: {
    conversationId: string;
    conversationName?: string;
    conversationType?: 'private' | 'group';
  };
  
  // Create new group screen
  CreateGroup: undefined;
  
  // Group info/edit screen
  GroupInfo: {
    conversationId: string;
  };
  
  // Add participants to group
  AddParticipants: {
    conversationId: string;
  };
  
  // Settings screen
  Settings: undefined;
  
  // Profile screen
  Profile: undefined;
  
  // Search users screen
  SearchUsers: undefined;
  
  // Invite contacts screen
  InviteContacts: undefined;
  
  // Media viewer (for viewing images/videos in full screen)
  MediaViewer: {
    mediaUrl: string;
    type: 'image' | 'video';
  };
  
  // Location viewer (for viewing shared locations)
  LocationViewer: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
};

// Tab navigator screens
export type TabParamList = {
  Chats: undefined;
  Groups: undefined;
  Calls: undefined; // For future voice/video calls
  Settings: undefined;
};

// Root stack (combines auth and main stacks)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Declare the navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
