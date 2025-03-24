import { supabase } from '../lib/supabase';
import { storeUserInfo, storeAuthToken, clearUserData, getUserInfo } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  interests: string[];
  major: string;
  year: string;
  degree: string;
  role: string;
  notifications_enabled?: boolean;
  dark_mode?: boolean;
  bio?: string;
  phone_number?: string;
  linkedin_url?: string;
  github_url?: string;
  resume_url?: string;
};

/**
 * Sign up a new user
 * @param email User email
 * @param password User password
 * @param fullName User's full name
 * @returns User data or error
 */
export const signUp = async (
  email: string,
  password: string,
  fullName: string
): Promise<{ user: UserProfile | null; error: any }> => {
  try {
    console.log('Starting signup process for:', email);
    
    // Basic validation
    if (!email || !password || !fullName) {
      return { 
        user: null, 
        error: { message: 'Email, password, and full name are required' } 
      };
    }

    // Sign up with Supabase Auth
    console.log('Calling Supabase auth.signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return { user: null, error };
    }

    if (!data?.user) {
      console.error('No user data returned from signup');
      return { 
        user: null, 
        error: { message: 'Failed to create user account' } 
      };
    }

    console.log('User created successfully with ID:', data.user.id);

    // Create user profile object
    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || '',
      full_name: fullName,
      interests: [],
      major: '',
      year: '',
      degree: '',
      role: 'user'
    };

    // Store session token if available
    if (data.session?.access_token) {
      console.log('Storing auth token...');
      await storeAuthToken(data.session.access_token);
    } else {
      console.log('No session token available');
    }

    // Store user profile data locally
    console.log('Storing user profile locally...');
    await storeUserInfo(userProfile);
    
    console.log('Signup process completed successfully');
    return { user: userProfile, error: null };
  } catch (error) {
    console.error('Exception during signup process:', error);
    return { 
      user: null, 
      error: { message: error instanceof Error ? error.message : 'An unexpected error occurred during signup' } 
    };
  }
};

/**
 * Sign in a user with email and password
 * @param email User email
 * @param password User password
 * @returns User object or error
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: any }> => {
  try {
    console.log('Starting sign in process for:', email);

    // First get existing profile if any
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Existing profile:', existingProfile);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }

    if (!data?.user) {
      console.error('No user data returned from sign in');
      return { user: null, error: { message: 'Failed to sign in' } };
    }

    // Get user metadata
    const metadata = data.user.user_metadata || {};
    console.log('User metadata:', metadata);

    // Create user profile object, preserving existing data
    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || '',
      full_name: metadata.full_name || existingProfile?.full_name || '',
      interests: metadata.interests || existingProfile?.interests || [],
      major: metadata.major || existingProfile?.major || '',
      year: metadata.year || existingProfile?.year || '',
      degree: metadata.degree || existingProfile?.degree || '',
      role: metadata.role || existingProfile?.role || '',
      avatar_url: existingProfile?.avatar_url || null,
      notifications_enabled: existingProfile?.notifications_enabled ?? true,
      dark_mode: existingProfile?.dark_mode ?? false
    };

    // Store session token
    if (data.session?.access_token) {
      console.log('Storing auth token...');
      await storeAuthToken(data.session.access_token);
    }

    // Store user info
    console.log('Storing user profile:', userProfile);
    await storeUserInfo(userProfile);

    // Update profiles table if needed
    if (!existingProfile || existingProfile.role !== metadata.role) {
      try {
        // Use only essential fields for now
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: userProfile.id,
            email: userProfile.email,
            full_name: userProfile.full_name,
            role: userProfile.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userProfile.id);
            
        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          console.log('Profile updated successfully with essential fields');
        }
      } catch (error) {
        console.error('Exception during profile update:', error);
      }
    }

    return { user: userProfile, error: null };
  } catch (error) {
    console.error('Exception during sign in:', error);
    return { 
      user: null, 
      error: { message: error instanceof Error ? error.message : 'An unexpected error occurred during sign in' } 
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: any }> => {
  try {
    console.log('Signing out user...');
    await supabase.auth.signOut();
    await clearUserData();
    console.log('User signed out successfully');
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    console.log('Checking authentication status...');
    
    // Check Supabase session
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      console.log('Supabase session found, user is authenticated');
      return true;
    }
    
    // Check local storage as fallback
    const userInfo = await getUserInfo();
    if (userInfo) {
      console.log('User info found in storage, user is authenticated');
      return true;
    }
    
    console.log('No authentication found, user is not authenticated');
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    
    // Check local storage as fallback
    try {
      const userInfo = await getUserInfo();
      if (userInfo) {
        console.log('User info found in storage, user is authenticated (fallback)');
        return true;
      }
    } catch (e) {
      console.error('Error checking local storage:', e);
    }
    
    return false;
  }
};

/**
 * Get the current user's profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    return await getUserInfo();
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}; 

/**
 * Update user profile
 * @param profileData User profile data to update
 * @returns Success or error
 */
export const updateUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<{ error: any }> => {
  try {
    console.log('Updating user profile...', profileData);
    
    // Basic validation
    if (!profileData.email) {
      return { 
        error: { message: 'Email is required' } 
      };
    }

    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return { error: { message: 'User not found' } };
    }

    // Update user metadata in Supabase Auth
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        major: profileData.major,
        year: profileData.year,
        interests: profileData.interests,
        notifications_enabled: profileData.notifications_enabled,
        dark_mode: profileData.dark_mode,
        degree: profileData.degree,
        bio: profileData.bio,
        phone_number: profileData.phone_number,
        linkedin_url: profileData.linkedin_url,
        github_url: profileData.github_url,
        resume_url: profileData.resume_url,
      }
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      return { error: metadataError };
    }

    // Get the updated user profile
    const updatedProfile = {
      id: userData.user.id,
      email: profileData.email,
      full_name: profileData.full_name || '',
      avatar_url: profileData.avatar_url,
      major: profileData.major || '',
      year: profileData.year || '',
      interests: profileData.interests || [],
      notifications_enabled: profileData.notifications_enabled,
      dark_mode: profileData.dark_mode,
      role: profileData.role || 'user',
      degree: profileData.degree || '',
      bio: profileData.bio,
      phone_number: profileData.phone_number,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url,
      resume_url: profileData.resume_url,
    };

    // Store updated profile locally
    await storeUserInfo(updatedProfile as UserProfile);
    
    console.log('User profile updated successfully', updatedProfile);
    return { error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error: { message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
  }
};

/**
 * Check if the user has admin privileges
 * @returns Boolean indicating if the user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    // Get current session with fresh data
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return false;
    }
    
    const session = sessionData.session;
    if (!session) {
      console.log('No active session found');
      return false;
    }
    
    // Get user data with the latest metadata
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user data:', userError);
      return false;
    }

    const user = userData.user;
    console.log('Checking admin status for user:', user.email);

    // Use our RPC function to check admin status
    const { data: checkData, error: checkError } = await supabase
      .rpc('check_admin_role', { 
        user_email: user.email 
      });

    if (checkError) {
      console.error('Error checking admin role:', checkError);
      return false;
    }

    const isAdminUser = checkData?.is_admin || false;
    console.log('Admin check result:', isAdminUser);
    return isAdminUser;

  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Set admin privileges for a user using Supabase
 * @param email User email
 * @returns Success or error
 */
export const setAdminPrivileges = async (email: string): Promise<{ success: boolean; error: any }> => {
  try {
    console.log('Setting admin privileges for:', email);
    
    // Get the user's UUID from their email
    const { data: userAuthData, error: userAuthError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (userAuthError) {
      console.error('Error finding user in auth.users:', userAuthError);
      
      // Try alternative approach - check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      if (profileError) {
        console.error('Error finding user in profiles:', profileError);
        return { success: false, error: `User not found with email: ${email}` };
      }
      
      if (!profileData) {
        return { success: false, error: `No user found with email: ${email}` };
      }
    }
    
    // Use RPC function to update user metadata
    const { error: rpcError } = await supabase.rpc('set_admin_role', { 
      user_email: email 
    });
    
    if (rpcError) {
      console.error('Error executing RPC function:', rpcError);
      return { success: false, error: `Failed to set admin privileges: ${rpcError.message}` };
    }
    
    console.log('Admin privileges set successfully for:', email);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting admin privileges:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Check if a user exists in the database
 * @param email User email
 * @returns Information about where the user exists
 */
export const checkUserExists = async (email: string): Promise<{ 
  exists: boolean; 
  inProfiles: boolean;
  inAuth: boolean;
  details: string;
}> => {
  try {
    console.log('Checking if user exists:', email);
    let details = '';
    
    // Check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email);
      
    const inProfiles = !profileError && profileData && profileData.length > 0;
    if (inProfiles) {
      details += `Found in profiles table with ID: ${profileData[0].id}\n`;
    } else {
      details += `Not found in profiles table. Error: ${profileError?.message || 'No error'}\n`;
    }
    
    // Check auth.users table directly with RPC
    const { data: authData, error: authError } = await supabase.rpc('check_user_in_auth', {
      user_email: email
    });
    
    const inAuth = !authError && authData && authData > 0;
    if (inAuth) {
      details += `Found in auth.users table\n`;
    } else {
      details += `Not found in auth.users table. Error: ${authError?.message || 'No error'}\n`;
    }
    
    return {
      exists: inProfiles || inAuth,
      inProfiles,
      inAuth,
      details
    };
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return {
      exists: false,
      inProfiles: false,
      inAuth: false,
      details: `Error checking user: ${error}`
    };
  }
};

/**
 * Set admin role in all possible locations
 * @param email User email
 * @returns Success status and any error
 */
export const setAdminRoleEverywhere = async (email: string): Promise<{ success: boolean; error: any; details: string }> => {
  try {
    console.log('Setting admin role everywhere for:', email);
    let details = '';
    
    // First check if the user exists
    const userCheck = await checkUserExists(email);
    details += `User check results:\n${userCheck.details}\n`;
    
    if (!userCheck.exists) {
      return { 
        success: false, 
        error: `User not found with email: ${email}`, 
        details 
      };
    }
    
    // If user exists in profiles table, update it
    if (userCheck.inProfiles) {
      // Get the user ID from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      const userId = profileData?.id;
      details += `Found user ID: ${userId}\n`;
      
      // Update profiles table directly
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email);
        
      if (profileUpdateError) {
        details += `Error updating profiles table: ${profileUpdateError.message}\n`;
      } else {
        details += `Updated role in profiles table\n`;
      }
    }
    
    // If user exists in auth table, update metadata
    if (userCheck.inAuth) {
      // Update user_metadata via RPC function
      const { error: rpcError } = await supabase.rpc('set_admin_role', { 
        user_email: email 
      });
      
      if (rpcError) {
        details += `Error executing RPC function: ${rpcError.message}\n`;
      } else {
        details += `Updated user_metadata via RPC\n`;
      }
      
      // Try direct SQL update as a fallback
      const { error: directUpdateError } = await supabase.rpc('direct_update_user_metadata', { 
        target_email: email,
        metadata_json: JSON.stringify({ role: 'admin' })
      });
      
      if (directUpdateError) {
        details += `Error with direct metadata update: ${directUpdateError.message}\n`;
      } else {
        details += `Updated metadata via direct update\n`;
      }
    }
    
    // Consider it a success if we were able to update at least one location
    const success = details.includes('Updated');
    
    return { 
      success, 
      error: success ? null : 'Failed to update admin role in any location', 
      details 
    };
  } catch (error) {
    console.error('Error setting admin role everywhere:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      details: `Exception: ${error}` 
    };
  }
};