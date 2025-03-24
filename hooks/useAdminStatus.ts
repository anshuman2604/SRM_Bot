import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserInfo } from '../services/storage';

/**
 * Custom hook to check if the current user has admin privileges
 * @returns Object with admin status, loading state, and error
 */
export const useAdminStatus = () => {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check local storage for user profile
      const userProfile = await getUserInfo();
      
      if (userProfile && userProfile.role === 'admin') {
        console.log('User is admin according to local profile');
        setIsAdminUser(true);
        setIsLoading(false);
        return;
      }

      // If not admin in local storage, check Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Failed to get user session');
        setIsLoading(false);
        return;
      }

      const session = sessionData.session;
      if (!session) {
        console.log('No active session found');
        setIsLoading(false);
        return;
      }

      // Get user data with the latest metadata
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('Error getting user data:', userError);
        setError('Failed to get user data');
        setIsLoading(false);
        return;
      }

      const user = userData.user;

      // Check user metadata directly
      if (user.user_metadata && user.user_metadata.role === 'admin') {
        console.log('User is admin according to user_metadata');
        setIsAdminUser(true);
        setIsLoading(false);
        return;
      }

      // Use our RPC function to check admin status
      const { data: metaData, error: metaError } = await supabase
        .rpc('check_user_metadata', { 
          user_email: user.email 
        });

      if (metaError) {
        console.error('Error checking metadata:', metaError);
        setError('Error verifying admin access');
        setIsLoading(false);
        return;
      }
      
      // Use metadata to check admin status
      const isAdmin = metaData?.is_admin || false;
      
      if (isAdmin) {
        console.log('User is admin according to RPC check');
        setIsAdminUser(true);
      } else {
        console.log('User is NOT admin according to RPC check');
        setIsAdminUser(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('An error occurred while checking admin status');
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdminUser, isLoading, error };
};
