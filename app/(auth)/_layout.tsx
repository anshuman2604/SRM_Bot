import { Stack, useRouter } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../../services/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthLayout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a token in storage
        const token = await AsyncStorage.getItem('supabase.auth.token');
        if (token) {
          // We have a token, verify with Supabase
          const authenticated = await isAuthenticated();
          if (authenticated) {
            // Authenticated, redirect to app
            setTimeout(() => {
              router.replace('/(app)');
            }, 0);
            return;
          }
        }
        
        // Not authenticated, stay on login page
        setLoading(false);
      } catch (error) {
        console.error('Error checking authentication in auth layout:', error);
        setError('Error checking authentication. Please try again.');
        // If there's an error, stay on login page
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.error, marginBottom: 10 }}>{error}</Text>
        <Text style={{ color: COLORS.text }}>Please try again.</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
      initialRouteName="intro"
    >
      <Stack.Screen name="intro" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" />
    </Stack>
  );
} 