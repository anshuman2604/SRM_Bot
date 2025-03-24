import React, { ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/Config';
import { useAdminStatus } from '../hooks/useAdminStatus';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

/**
 * Higher-order component to protect admin routes
 * Only allows access to admin users, redirects others to home
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdminUser, isLoading, error } = useAdminStatus();
  const router = useRouter();

  // Redirect non-admin users to home
  React.useEffect(() => {
    if (!isLoading && !isAdminUser && !error) {
      console.log('User is not an admin, redirecting to home...');
      router.replace('/');
    }
  }, [isLoading, isAdminUser, error, router]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>Verifying admin access...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.text}>Please try again later</Text>
      </View>
    );
  }

  // If user is admin, render the children
  if (isAdminUser) {
    return <>{children}</>;
  }

  // Fallback loading state while redirect happens
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 18,
    marginBottom: 8,
  },
});
