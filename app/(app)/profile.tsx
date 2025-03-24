import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { Text, TextInput, Button, HelperText, Snackbar, Surface, Chip, IconButton, Avatar, Card, Title, Paragraph, Switch, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { getUserInfo, storeUserInfo, clearUserData } from '../../services/storage';
import { signOut, updateUserProfile, UserProfile } from '../../services/auth';
import { supabase } from '../../lib/supabase';

const DEGREE_OPTIONS = ['Bachelor', 'Master', 'PhD', 'Associate'];
const INTERESTS = ['AI', 'Machine Learning', 'Web Development', 'Mobile Apps', 'Data Science', 'Cybersecurity', 'Blockchain', 'IoT', 'Cloud Computing', 'Game Development'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    avatar_url: '',
    major: '',
    year: '',
    degree: '',
    interests: [],
    notifications_enabled: true,
    dark_mode: true,
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserProfile();
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      Alert.alert(
        'Session Expired',
        'Your login session has expired. Please log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    }
  };

  const loadUserProfile = async () => {
    try {
      const userInfo = await getUserInfo();
      console.log('Loaded user profile:', userInfo);
      if (userInfo) {
        setProfile(userInfo);
        if (userInfo.degree) {
          setSelectedDegree(userInfo.degree);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Check session before updating
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw new Error('Your session has expired. Please log in again.');
      }

      // Get the current user to ensure we have the email
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not found');
      }

      // Create an update object with all the fields
      const updateData = {
        // Always include the id and email to satisfy not-null constraint
        id: userData.user.id,
        email: userData.user.email || profile.email,
        // Include all profile fields
        role: profile.role || 'user',
        full_name: profile.full_name,
        major: profile.major,
        year: profile.year,
        interests: profile.interests,
        notifications_enabled: profile.notifications_enabled,
        dark_mode: profile.dark_mode,
        degree: selectedDegree,
      };

      console.log('Saving profile with data:', updateData);

      // Update the profile in the database
      const { error: updateError } = await updateUserProfile(updateData);
      
      if (updateError) {
        throw updateError;
      }

      // Reload the profile to ensure we have the latest data
      await loadUserProfile();

      setSnackbarMessage('Profile updated successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error && error.message && error.message.includes('session')) {
        Alert.alert(
          'Session Expired',
          'Your login session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleLogout();
              }
            }
          ]
        );
      } else {
        setError('Failed to update profile. Please try again.');
        setSnackbarMessage('Error: ' + (error instanceof Error ? error.message : 'Failed to update profile'));
        setSnackbarVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      console.log('Logging out...');
      
      // Clear user data from storage
      await clearUserData();
      
      // Sign out from Supabase (this might fail if there's no connection, but that's okay)
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out from Supabase:', error);
        // Continue with logout even if Supabase signout fails
      }
      
      console.log('Logout successful');
      
      // Show success message
      setSnackbarMessage('Logout successful!');
      setSnackbarVisible(true);
      
      // Navigate to login screen after a short delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => {
      const interests = prev.interests || [];
      if (interests.includes(interest)) {
        return {
          ...prev,
          interests: interests.filter(i => i !== interest)
        };
      } else {
        return {
          ...prev,
          interests: [...interests, interest]
        };
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          loading={loading}
          style={styles.logoutButton}
          color={COLORS.error}
        >
          Log Out
        </Button>
      </View>
      
      <Surface style={styles.header}>
        <Avatar.Icon size={80} icon="account" style={styles.avatar} />
        <Text style={styles.name}>{profile.full_name || 'Your Name'}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </Surface>

      <Surface style={styles.section}>
        <Title style={styles.sectionTitle}>Personal Information</Title>
        <TextInput
          label="Full Name"
          value={profile.full_name}
          onChangeText={(text) => setProfile({ ...profile, full_name: text })}
          mode="outlined"
          style={styles.input}
        />
        
        <Text style={styles.label}>Degree</Text>
        <View style={styles.chipContainer}>
          {DEGREE_OPTIONS.map((degree) => (
            <Chip
              key={degree}
              selected={selectedDegree === degree}
              onPress={() => setSelectedDegree(degree)}
              style={styles.chip}
              selectedColor={COLORS.primary}
            >
              {degree}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Major"
          value={profile.major}
          onChangeText={(text) => setProfile({ ...profile, major: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Year"
          value={profile.year}
          onChangeText={(text) => setProfile({ ...profile, year: text })}
          mode="outlined"
          style={styles.input}
          keyboardType="number-pad"
        />
      </Surface>

      <Surface style={styles.section}>
        <Title style={styles.sectionTitle}>Interests</Title>
        <Text style={styles.subtitle}>Select topics you're interested in</Text>
        <View style={styles.chipContainer}>
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              selected={profile.interests?.includes(interest)}
              onPress={() => toggleInterest(interest)}
              style={styles.chip}
              selectedColor={COLORS.primary}
            >
              {interest}
            </Chip>
          ))}
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Title style={styles.sectionTitle}>Preferences</Title>
        <View style={styles.preference}>
          <Text>Enable Notifications</Text>
          <Switch
            value={profile.notifications_enabled}
            onValueChange={(value) => setProfile({ ...profile, notifications_enabled: value })}
            color={COLORS.primary}
          />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.preference}>
          <Text>Dark Mode</Text>
          <Switch
            value={profile.dark_mode}
            onValueChange={(value) => setProfile({ ...profile, dark_mode: value })}
            color={COLORS.primary}
          />
        </View>
      </Surface>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.card,
    elevation: 2,
  },
  avatar: {
    backgroundColor: COLORS.primary,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    margin: 4,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
  },
  logoutContainer: {
    padding: 16,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
  },
}); 