import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { signIn, isAdmin } from '../../services/auth';
import { supabase } from '../../lib/supabase';

export default function AdminScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated as admin on component mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setInitialChecking(true);
      console.log('Checking if user is already authenticated as admin...');
      
      // Check if user is already authenticated as admin
      const adminStatus = await isAdmin();
      
      if (adminStatus) {
        console.log('User is already authenticated as admin, redirecting to dashboard...');
        // Redirect to admin dashboard
        router.replace('/admin/dashboard');
      } else {
        console.log('User is not authenticated as admin, showing login form...');
        setInitialChecking(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setInitialChecking(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Attempting login with email:', email);

      // Check metadata directly
      const { data: metaData, error: metaError } = await supabase
        .rpc('check_user_metadata', { 
          user_email: email 
        });

      if (metaError) {
        console.error('Error checking metadata:', metaError);
        setError('Error verifying admin access');
        return;
      }

      // Use metadata to check admin status
      const isAdmin = metaData?.is_admin || false;
      console.log('Admin check from metadata:', isAdmin, metaData);

      if (!isAdmin) {
        console.error('User is not an admin according to metadata:', metaData);
        setError('This account does not have admin privileges');
        return;
      }

      // If user is admin, proceed with sign in
      const { user, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message || 'Invalid email or password');
        return;
      }

      if (!user) {
        console.error('No user returned from sign in');
        setError('Failed to sign in');
        return;
      }
      
      console.log('Admin signed in successfully:', user.id);
      
      // Show success message and navigate to admin dashboard
      setSnackbarVisible(true);
      setTimeout(() => {
        router.replace('/admin/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while checking admin status
  if (initialChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Checking admin status...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Admin Access</Text>
        <Text style={styles.subtitle}>Sign in with your admin credentials</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          >
            Login
          </Button>
        </View>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Back to App
        </Button>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
        >
          Login successful! Redirecting to admin panel...
        </Snackbar>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 16,
  },
});