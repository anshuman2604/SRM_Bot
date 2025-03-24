import { router, usePathname } from 'expo-router';
import { isAuthenticated } from '../services/auth';

export async function withAuth() {
  try {
    const authenticated = await isAuthenticated();
    const pathname = usePathname();
    const isAuthGroup = pathname.startsWith('/(auth)');
    const isAdminRoute = pathname.includes('/admin');

    if (!authenticated && !isAuthGroup && !isAdminRoute) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (authenticated && isAuthGroup) {
      // Redirect to home if authenticated and trying to access auth group
      router.replace('/');
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
  }
} 