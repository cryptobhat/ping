/**
 * Auth Store - Manages authentication state
 * 
 * This store keeps track of:
 * - Whether user is logged in or not
 * - User information (phone, name, profile picture)
 * - Authentication token (JWT)
 * - Loading state during auth operations
 * 
 * Zustand is used because it's simpler than Redux but just as powerful.
 * It provides a single source of truth for auth state across the app.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our auth state
interface User {
  id: string;
  phone: string;
  name: string;
  profilePic?: string;
}

interface AuthState {
  // Current user data (null if not logged in)
  user: User | null;
  
  // Authentication token for API requests
  token: string | null;
  
  // Whether we're currently loading auth state (on app start)
  isLoading: boolean;
  
  // Whether we're currently performing an auth operation (login, logout)
  isAuthenticating: boolean;
  
  // Error message if something went wrong
  error: string | null;
}

interface AuthActions {
  // Login action - called after successful OTP verification
  login: (user: User, token: string) => void;
  
  // Logout action - clears user data and token
  logout: () => void;
  
  // Update user profile (name, profile picture)
  updateProfile: (name: string, profilePic?: string) => void;
  
  // Set loading state
  setLoading: (isLoading: boolean) => void;
  
  // Set authentication state (for login/out operations)
  setAuthenticating: (isAuthenticating: boolean) => void;
  
  // Set error message
  setError: (error: string | null) => void;
  
  // Clear error message
  clearError: () => void;
  
  // Reset entire auth state (useful for testing or complete reset)
  reset: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true, // Start as loading so we can check auth state on app launch
  isAuthenticating: false,
  error: null,
};

// Persist config - saves auth state to AsyncStorage
// So user stays logged in even after app restart
const persistConfig = {
  name: 'ping-auth-storage', // Key in AsyncStorage
  storage: AsyncStorage,
  partialize: (state: AuthState) => ({
    // Only persist these fields (not loading states or errors)
    user: state.user,
    token: state.token,
  }),
};

// Create the auth store
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,
      
      // Actions
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticating: false,
          isLoading: false,
          error: null,
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticating: false,
          error: null,
        });
      },
      
      updateProfile: (name, profilePic) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            name,
            profilePic: profilePic || state.user.profilePic,
          } : null,
        }));
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      setAuthenticating: (isAuthenticating) => {
        set({ isAuthenticating });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    persistConfig
  )
);

// Selector hooks for easier usage in components
// These prevent unnecessary re-renders by only selecting specific parts of state

export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAuthenticating = () => useAuthStore((state) => state.isAuthenticating);
export const useAuthError = () => useAuthStore((state) => state.error);
