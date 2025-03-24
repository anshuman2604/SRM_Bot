import { router } from 'expo-router';
import { isAuthenticated, isAdmin } from '../../services/auth';
import { Alert } from 'react-native';

export default async function adminMiddleware() {
  try {
    console.log('Admin middleware running - checking authentication...');
    
    // First check if user is authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log('User not authenticated, redirecting to login');
      
      // Show alert before redirecting
      Alert.alert(
        'Authentication Required',
        'You need to log in to access the admin panel.',
        [{ text: 'OK' }]
      );
      
      router.replace('/(auth)/login');
      return;
    }
    
    console.log('User is authenticated, checking admin privileges...');

    // Then check if user has admin privileges
    const hasAdminAccess = await isAdmin();
    if (!hasAdminAccess) {
      console.log('User does not have admin privileges, redirecting to home');
      
      // Show alert before redirecting
      Alert.alert(
        'Access Denied',
        'You do not have admin privileges. Please contact an administrator.',
        [{ text: 'OK' }]
      );
      
      router.replace('/');
      return;
    }

    // User is authenticated and has admin privileges, allow access
    console.log('Admin access granted');
  } catch (error) {
    console.error('Error in admin middleware:', error);
    
    // Show error alert
    Alert.alert(
      'Error',
      'An error occurred while checking admin access.',
      [{ text: 'OK' }]
    );
    
    // On error, redirect to home page
    router.replace('/');
  }
}
