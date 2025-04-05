// supabaseClient.js - Enhanced Supabase client with better error handling
import { createClient } from '@supabase/supabase-js';
import { retryNetworkRequest, checkInternetConnection } from './networkHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create enhanced Supabase client
const createEnhancedSupabaseClient = () => {
  // Create the client with AsyncStorage for persistence
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  // Wrap authentication methods with retry logic
  const enhancedAuth = {
    ...supabase.auth,
    
    // Enhanced sign in
    signInWithPassword: async (credentials) => {
      return retryNetworkRequest(
        async () => supabase.auth.signInWithPassword(credentials),
        parseInt(process.env.EXPO_PUBLIC_AUTH_RETRY_COUNT || '5'),
        parseInt(process.env.EXPO_PUBLIC_AUTH_TIMEOUT_MS || '2000')
      );
    },
    
    // Enhanced sign up
    signUp: async (credentials) => {
      return retryNetworkRequest(
        async () => supabase.auth.signUp(credentials),
        parseInt(process.env.EXPO_PUBLIC_AUTH_RETRY_COUNT || '5'),
        parseInt(process.env.EXPO_PUBLIC_AUTH_TIMEOUT_MS || '2000')
      );
    },
    
    // Enhanced sign out
    signOut: async () => {
      const isOnline = await checkInternetConnection();
      if (!isOnline) {
        console.log('Device is offline, performing local sign out only');
        // Clear local session data
        await AsyncStorage.removeItem('supabase.auth.token');
        return { error: null };
      }
      
      return retryNetworkRequest(
        async () => supabase.auth.signOut(),
        parseInt(process.env.EXPO_PUBLIC_AUTH_RETRY_COUNT || '3'),
        parseInt(process.env.EXPO_PUBLIC_AUTH_TIMEOUT_MS || '1000')
      );
    }
  };
  
  // Return enhanced client
  return {
    ...supabase,
    auth: enhancedAuth
  };
};

// Export the enhanced client
export const supabase = createEnhancedSupabaseClient();

// Export a function to check auth status that works offline
export const getAuthStatus = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem('supabase.auth.token');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return { session, user: session?.user || null };
    }
    return { session: null, user: null };
  } catch (error) {
    console.error('Error getting auth status:', error);
    return { session: null, user: null, error };
  }
};
