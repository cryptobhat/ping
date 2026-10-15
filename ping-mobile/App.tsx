/**
 * Ping App - Main Entry Point
 * 
 * This is the root component of the Ping messaging app.
 * It wraps the entire application with necessary providers:
 * - React Native Paper Theme Provider (for consistent styling)
 * - Redux Provider (for state management - using Zustand)
 * - Root Navigator (for navigation)
 * 
 * The app follows this structure:
 * - App.tsx (this file) - Root providers
 * - RootNavigator - Handles auth vs main app routing
 * - AuthNavigator - Handles login/registration flow
 * - MainTabNavigator - Handles main app tabs
 * - Individual screens in src/screens/
 */

import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/theme';
import { StatusBar } from 'expo-status-bar';

// Main App component
export default function App() {
  return (
    // SafeAreaProvider ensures content doesn't overlap with notches/home indicators
    <SafeAreaProvider>
      {/* PaperProvider provides theme and styling to all React Native Paper components */}
      <PaperProvider theme={theme}>
        {/* StatusBar for iOS - shows network, time, battery */}
        <StatusBar style="light" />
        
        {/* RootNavigator handles all app navigation */}
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
