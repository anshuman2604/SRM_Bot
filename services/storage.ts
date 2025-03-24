import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './auth';

const USER_INFO_KEY = 'user_info';
const AUTH_TOKEN_KEY = 'supabase.auth.token';

/**
 * Store data in AsyncStorage
 * @param key Storage key
 * @param value Data to store
 */
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
};

/**
 * Get data from AsyncStorage
 * @param key Storage key
 * @returns Stored data or null if not found
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 * @param key Storage key
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
};

/**
 * Store user information in AsyncStorage
 * @param userInfo User profile information
 */
export const storeUserInfo = async (userInfo: UserProfile): Promise<void> => {
  try {
    console.log('Storing user info in AsyncStorage:', JSON.stringify(userInfo, null, 2));
    const jsonValue = JSON.stringify(userInfo);
    await AsyncStorage.setItem(USER_INFO_KEY, jsonValue);
    console.log('User info stored successfully');
  } catch (error) {
    console.error('Error storing user info:', error);
    throw error;
  }
};

/**
 * Get user information from AsyncStorage
 * @returns User profile or null if not found
 */
export const getUserInfo = async (): Promise<UserProfile | null> => {
  try {
    console.log('Getting user info from AsyncStorage');
    const jsonValue = await AsyncStorage.getItem(USER_INFO_KEY);
    if (!jsonValue) {
      console.log('No user info found in AsyncStorage');
      return null;
    }
    const userInfo = JSON.parse(jsonValue) as UserProfile;
    console.log('User info retrieved successfully:', JSON.stringify(userInfo, null, 2));
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

/**
 * Store authentication token in AsyncStorage
 * @param token Authentication token
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    console.log('Storing auth token in AsyncStorage');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    console.log('Auth token stored successfully');
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

/**
 * Get authentication token from AsyncStorage
 * @returns Authentication token or null if not found
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    console.log('Getting auth token from AsyncStorage');
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    console.log('Auth token retrieved:', token ? 'Token found' : 'No token found');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Clear user data from AsyncStorage
 */
export const clearUserData = async (): Promise<void> => {
  try {
    console.log('Clearing user data from AsyncStorage');
    await AsyncStorage.multiRemove([USER_INFO_KEY, AUTH_TOKEN_KEY]);
    console.log('User data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
}; 