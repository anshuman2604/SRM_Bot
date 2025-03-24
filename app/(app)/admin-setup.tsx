import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, Snackbar, Dialog, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { setAdminRoleEverywhere, checkUserExists } from '../../services/auth';
import { supabase } from '../../lib/supabase';

export default function AdminSetupScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsText, setDetailsText] = useState('');
  const router = useRouter();

  const handleSetAdmin = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      console.log('Attempting to set admin privileges for:', email);

      // Use our comprehensive function to set admin role everywhere
      const { success, error: adminError, details } = await setAdminRoleEverywhere(email);

      // Store details for viewing
      setDetailsText(details);

      if (!success) {
        console.error('Error setting admin privileges:', adminError);
        setError(adminError || 'Failed to set admin privileges');
        return;
      }

      console.log('Admin privileges set successfully');
      setSuccess(`Admin privileges granted to ${email}`);
      setSnackbarVisible(true);
      setEmail('');
    } catch (error) {
      console.error('Error in handleSetAdmin:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAdminStatus = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      console.log('Checking admin status for:', email);

      // First check if user exists
      const userExists = await checkUserExists(email);
      setDetailsText(userExists.details);

      if (!userExists.exists) {
        setError(`User not found with email: ${email}`);
        return;
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single();

      if (userError) {
        console.error('Error finding user:', userError);
        setError(`Error checking role: ${userError.message}`);
        return;
      }

      // Check user role
      const role = userData?.role || 'user';
      console.log('User role:', role);
      
      if (role === 'admin') {
        setSuccess(`${email} already has admin privileges`);
      } else {
        setSuccess(`${email} does not have admin privileges (current role: ${role})`);
      }
      
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const showDetails = () => {
    setDetailsVisible(true);
  };

  const hideDetails = () => {
    setDetailsVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Admin Setup" />
        <Card.Content>
          <Text style={styles.description}>
            Use this tool to grant admin privileges to a user. Enter the email address of the user you want to make an admin.
          </Text>

          <TextInput
            label="User Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {error ? (
            <View>
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
              {detailsText ? (
                <Button 
                  mode="text" 
                  onPress={showDetails} 
                  compact
                  style={styles.detailsButton}
                >
                  Show Details
                </Button>
              ) : null}
            </View>
          ) : null}

          {success ? (
            <View>
              <HelperText type="info" visible={!!success}>
                {success}
              </HelperText>
              {detailsText ? (
                <Button 
                  mode="text" 
                  onPress={showDetails} 
                  compact
                  style={styles.detailsButton}
                >
                  Show Details
                </Button>
              ) : null}
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSetAdmin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Set As Admin
            </Button>

            <Button
              mode="outlined"
              onPress={handleCheckAdminStatus}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Check Admin Status
            </Button>
          </View>

          <Text style={styles.noteText}>
            Note: This will update the user's role in both the database and user metadata.
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        Back
      </Button>

      <Portal>
        <Dialog visible={detailsVisible} onDismiss={hideDetails}>
          <Dialog.Title>Detailed Information</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.detailsScroll}>
              <Text>{detailsText}</Text>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDetails}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {success}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    marginVertical: 16,
    backgroundColor: COLORS.card,
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 6,
  },
  noteText: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: 16,
  },
  detailsButton: {
    marginTop: -8,
    marginBottom: 8,
  },
  detailsScroll: {
    maxHeight: 300,
  },
});
