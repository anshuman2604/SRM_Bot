import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Text, TextInput, Button, HelperText, Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { signIn, signUp } from '../../services/auth';

// Login Screen Component
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const validateForm = () => {
    // Reset error
    setError('');
    
    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate password
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    
    // For signup, validate additional fields
    if (!isLogin) {
      // Validate password length
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      
      // Validate password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
      // Validate full name
      if (!fullName.trim()) {
        setError('Full name is required');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        // Handle login
        result = await signIn(email, password);
      } else {
        // Handle signup
        setSnackbarMessage('Creating your account...');
        setSnackbarVisible(true);
        
        console.log('Starting signup process for:', email);
        result = await signUp(email, password, fullName);
      }

      // Handle result
      if (result.error) {
        console.error('Authentication error:', result.error);
        setError(result.error.message || 'Authentication failed. Please try again.');
      } else if (result.user) {
        // Success case
        console.log('Authentication successful, navigating to app...');
        setSnackbarMessage(isLogin ? 'Login successful!' : 'Account created successfully!');
        setSnackbarVisible(true);
        
        // Navigate to the app after a short delay
        setTimeout(() => {
          router.replace('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <View style={styles.logoShape} />
            </View>
          </View>
          
          <Text style={styles.title}>Log in or sign up</Text>
          
          {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              disabled={loading}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              theme={{ colors: { background: COLORS.card } }}
            />
            
            {!isLogin && (
              <>
                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  mode="outlined"
                  style={styles.input}
                  disabled={loading}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  theme={{ colors: { background: COLORS.card } }}
                />
              </>
            )}
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              disabled={loading}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              theme={{ colors: { background: COLORS.card } }}
              right={
                <TextInput.Icon 
                  icon="eye" 
                  color={COLORS.textSecondary}
                />
              }
            />
            
            {!isLogin && (
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                disabled={loading}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                theme={{ colors: { background: COLORS.card } }}
              />
            )}
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Continue
          </Button>
          
          <Text style={styles.orText}>or</Text>
          
          <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoShape: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    transform: [{ translateX: 10 }, { translateY: -5 }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: COLORS.text,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  orText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: 16,
    fontSize: 16,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  toggleText: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: COLORS.card,
  }
});

export default LoginScreen;