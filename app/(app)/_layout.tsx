import { Stack, useRouter } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../../services/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppLayout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a token in storage
        const token = await AsyncStorage.getItem('supabase.auth.token');
        if (!token) {
          // No token, redirect to login
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 0);
          return;
        }
        
        // Then verify with Supabase
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          // Not authenticated, redirect to login
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 0);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Error checking authentication. Please try again.');
        // If there's an error, assume not authenticated
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } finally {
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
        <Text style={{ color: COLORS.text }}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          title: 'Home'
        }}
      />
      <Stack.Screen 
        name="chat"
        options={{
          title: 'Chat'
        }}
      />
      <Stack.Screen 
        name="events"
        options={{
          title: 'Events'
        }}
      />
      <Stack.Screen 
        name="resources"
        options={{
          title: 'Resources'
        }}
      />
      <Stack.Screen 
        name="profile"
        options={{
          title: 'Profile'
        }}
      />
      <Stack.Screen 
        name="admin"
        options={{
          title: 'Admin'
        }}
      />
    </Stack>
  );
} 