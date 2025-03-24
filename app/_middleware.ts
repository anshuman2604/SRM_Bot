import { router } from 'expo-router';
import { isAuthenticated } from '../services/auth';

export default async function middleware() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.replace('/(auth)/login');
    }
  } catch (error) {
    console.error('Error in middleware:', error);
  }
} 