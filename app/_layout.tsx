import React, { useState, useEffect } from 'react';
import { Slot, router } from 'expo-router';
import { Provider as PaperProvider, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { COLORS } from '../constants/Config';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './splash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthenticated } from '../services/auth';

// Combine navigation theme with Paper theme
const { DarkTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDarkTheme,
});

// Create custom theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.card,
    text: COLORS.text,
    error: COLORS.error,
  },
};

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
    setIsAppReady(true);
  };

  // Handle navigation after component is mounted and splash is complete
  useEffect(() => {
    if (isAppReady) {
      const checkAuthAndNavigate = async () => {
        try {
          // Check if user is authenticated
          const token = await AsyncStorage.getItem('supabase.auth.token');
          if (token) {
            const authenticated = await isAuthenticated();
            if (authenticated) {
              // User is authenticated, navigate to app
              router.replace('/(app)');
              return;
            }
          }
          
          // User is not authenticated, navigate to auth flow
          router.replace('/(auth)/intro');
        } catch (error) {
          console.error('Error checking authentication:', error);
          // Default to auth flow on error
          router.replace('/(auth)/intro');
        }
      };
      
      checkAuthAndNavigate();
    }
  }, [isAppReady]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <Slot />
      )}
    </PaperProvider>
  );
}