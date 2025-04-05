// networkHelper.js - Utilities to handle network issues
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Check if the device has internet connection
export const checkInternetConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return false;
  }
};

// Get network information for debugging
export const getNetworkInfo = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
      platform: Platform.OS
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return { error: error.message };
  }
};

// Helper function to retry failed network requests
export const retryNetworkRequest = async (requestFn, maxRetries = 5, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check internet connection before attempting
      const hasConnection = await checkInternetConnection();
      if (!hasConnection) {
        console.log(`No internet connection, waiting before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Attempt the request
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.log(`Request failed (attempt ${attempt + 1}/${maxRetries}): ${error.message}`);
      
      // Increase delay with each retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError || new Error('Network request failed after multiple retries');
};

// Function to handle offline mode
export const handleOfflineMode = async (onlineAction, offlineAction) => {
  const isOnline = await checkInternetConnection();
  
  if (isOnline) {
    return onlineAction();
  } else {
    console.log('Device is offline, using offline mode');
    return offlineAction();
  }
};
