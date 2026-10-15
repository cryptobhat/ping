/**
 * Ping App Theme Configuration
 * 
 * This file defines the color scheme and styling for the entire app.
 * We use React Native Paper for UI components which follows Material Design.
 * 
 * Color Palette:
 * - Primary: Deep purple (#6A5ACD) - represents trust and privacy
 * - Secondary: Teal (#20B2AA) - for accents and actions
 * - Background: Dark theme (#1a1a2e, #16213e) - easy on eyes
 * - Text: Light colors for dark mode
 */

import { MD3DarkTheme as DefaultTheme, MD3LightTheme } from 'react-native-paper';

// Custom colors for Ping app
const colors = {
  // Primary colors - used for main actions (send button, active tabs)
  primary: '#6A5ACD', // Slate Blue - represents trust
  primaryLight: '#9370DB',
  primaryDark: '#483D8B',
  
  // Secondary colors - used for accents
  secondary: '#20B2AA', // Light Sea Green
  secondaryLight: '#48D1CC',
  secondaryDark: '#008B8B',
  
  // Background colors
  background: '#1a1a2e', // Dark blue-gray - main background
  surface: '#16213e', // Slightly lighter - cards, chat bubbles
  surfaceVariant: '#0f3460',
  
  // Text colors
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#E0E0E0', // Light gray text on dark background
  onSurfaceVariant: '#B0B0B0',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Chat specific colors
  receivedMessage: '#2a2a3e', // Darker for received messages
  sentMessage: '#6A5ACD', // Primary color for sent messages
  
  // Border colors
  border: '#2a2a3e',
};

// Dark theme (default for Ping)
export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onSurface: colors.onSurface,
    onSurfaceVariant: colors.onSurfaceVariant,
    error: colors.error,
    onError: '#FFFFFF',
    outline: colors.border,
    outlineVariant: colors.border,
  },
};

// Light theme (optional)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onSurface: '#1a1a2e',
    onSurfaceVariant: '#483D8B',
    error: colors.error,
    onError: '#FFFFFF',
    outline: '#E0E0E0',
  },
};

// Custom theme with additional app-specific styles
export const theme = {
  ...darkTheme,
  custom: {
    colors,
    // Spacing scale (in pixels)
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    // Border radius
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      round: 50,
    },
    // Shadows
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
    },
    // Typography
    typography: {
      fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
      },
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 28,
      },
    },
  },
};

export type ThemeType = typeof theme;
