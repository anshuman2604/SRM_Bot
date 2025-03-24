import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, Title, Button, DataTable, IconButton, FAB, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS, EVENT_CATEGORIES, RESOURCE_TYPES } from '../../constants/Config';
import { getUserInfo, clearUserData } from '../../services/storage';
import { sendMessageToAIMLAPI } from '../../services/openai-client';
import { supabase } from '../../lib/supabase';

// Interfaces for data types
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  contact_info?: string;
  website_url?: string;
  application_method?: string;
  registration_link?: string;
  organizer?: string;
  additional_details?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  subject: string;
  url: string;
}

// Storage keys for admin data
const STORAGE_KEYS = {
  EVENTS: 'admin_events',
  RESOURCES: 'admin_resources',
};

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'event' | 'resource'>('event');
  const [formData, setFormData] = useState<any>({});
  const [processingAI, setProcessingAI] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getUserInfo();
      
      if (!user || user.role !== 'admin') {
        Alert.alert('Unauthorized', 'You must be logged in as an admin to access this page.');
        router.replace('/admin');
        return;
      }
      
      setUserInfo(user);
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert('Error', 'Failed to verify authentication. Please log in again.');
      router.replace('/admin');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get data from Supabase
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
        
      if (eventsError) throw eventsError;
      
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*');
        
      if (resourcesError) throw resourcesError;
      
      setEvents(eventsData || []);
      setResources(resourcesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearUserData();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBack = () => {
    // Navigate back to the main app without logging out
    router.replace('/');
  };

  const handleDelete = async (id: string, type: 'event' | 'resource') => {
    try {
      if (type === 'event') {
        // Delete from Supabase
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update local state
        const updatedEvents = events.filter(event => event.id !== id);
        setEvents(updatedEvents);
      } else {
        // Delete from Supabase
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update local state
        const updatedResources = resources.filter(resource => resource.id !== id);
        setResources(updatedResources);
      }
      Alert.alert('Success', `${type === 'event' ? 'Event' : 'Resource'} deleted successfully.`);
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', `Failed to delete ${type}. Please try again.`);
    }
  };

  const openAddDialog = (type: 'event' | 'resource') => {
    setDialogType(type);
    setFormData({});
    setNaturalLanguageInput('');
    setUseNaturalLanguage(false);
    setShowAdditionalFields(false);
    setDialogVisible(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const processWithAI = async (data: any, type: 'event' | 'resource') => {
    setProcessingAI(true);
    
    // Dismiss keyboard to prevent it from getting stuck
    if (Platform && Platform.OS !== 'web') {
      try {
        const { Keyboard } = require('react-native');
        Keyboard.dismiss();
      } catch (error) {
        console.error('Error dismissing keyboard:', error);
      }
    }
    
    try {
      // Skip API call and use local processing
      console.log("Using local processing instead of API");
      
      if (useNaturalLanguage && naturalLanguageInput) {
        // Generate data from natural language input
        if (type === 'event') {
          return generateMockEventFromText(naturalLanguageInput);
        } else {
          return generateMockResourceFromText(naturalLanguageInput);
        }
      } else {
        // Just validate the form data
        return type === 'event' ? validateEventData(data) : validateResourceData(data);
      }
    } catch (error) {
      console.error('Processing error:', error);
      return type === 'event' ? validateEventData(data) : validateResourceData(data);
    } finally {
      setProcessingAI(false);
    }
  };

  // Helper function to extract structured data from text
  const extractStructuredData = (text: string, type: 'event' | 'resource'): any => {
    const data: any = {};
    
    // Extract title
    const titleMatch = text.match(/title[:\s]+([^\n]+)/i);
    if (titleMatch && titleMatch[1]) {
      data.title = titleMatch[1].trim();
    }
    
    // Extract description
    const descMatch = text.match(/description[:\s]+([^\n]+)/i);
    if (descMatch && descMatch[1]) {
      data.description = descMatch[1].trim();
    }
    
    if (type === 'event') {
      // Extract date
      const dateMatch = text.match(/date[:\s]+([^\n]+)/i);
      if (dateMatch && dateMatch[1]) {
        data.date = dateMatch[1].trim();
        
        // Try to extract time from date
        try {
          const dateObj = new Date(data.date);
          if (!isNaN(dateObj.getTime())) {
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            data.time = `${hours}:${minutes}:00`;
          } else {
            data.time = '15:00:00'; // Default to 3 PM
          }
        } catch (error) {
          console.error('Error extracting time from date:', error);
          data.time = '15:00:00'; // Default to 3 PM
        }
      } else {
        // Default time if no date provided
        data.time = '15:00:00';
      }
      
      // Extract location
      const locationMatch = text.match(/location[:\s]+([^\n]+)/i);
      if (locationMatch && locationMatch[1]) {
        data.location = locationMatch[1].trim();
      }
      
      // Extract category
      const categoryMatch = text.match(/category[:\s]+([^\n]+)/i);
      if (categoryMatch && categoryMatch[1]) {
        data.category = categoryMatch[1].trim();
      }
      
      // Extract organizer
      const organizerMatch = text.match(/organizer[:\s]+([^\n]+)/i) || text.match(/organized by[:\s]+([^\n]+)/i);
      if (organizerMatch && organizerMatch[1]) {
        data.organizer = organizerMatch[1].trim();
      }
      
      // Extract contact info
      const contactMatch = text.match(/contact[:\s]+([^\n]+)/i) || text.match(/contact info[:\s]+([^\n]+)/i);
      if (contactMatch && contactMatch[1]) {
        data.contact_info = contactMatch[1].trim();
      }
      
      // Extract website URL
      const websiteMatch = text.match(/website[:\s]+([^\n]+)/i) || text.match(/website url[:\s]+([^\n]+)/i);
      if (websiteMatch && websiteMatch[1]) {
        data.website_url = websiteMatch[1].trim();
      } else {
        // Try to find URLs in the text
        const urlRegex = /(https?:\/\/[^\s*]+)/g;
        const urls = text.match(urlRegex);
        
        if (urls && urls.length > 0) {
          // Check each URL to determine if it's a registration link or website
          for (const url of urls) {
            // Clean up the URL (remove trailing punctuation, etc.)
            const cleanUrl = url.replace(/[.,;:!?*]*$/, '');
            
            // Check if this URL is mentioned near registration-related words
            const urlIndex = text.indexOf(url);
            if (urlIndex !== -1) {
              const contextStart = Math.max(0, urlIndex - 50);
              const contextEnd = Math.min(text.length, urlIndex + 50);
              const context = text.substring(contextStart, contextEnd).toLowerCase();
              
              if (context.includes('register') || 
                  context.includes('sign up') || 
                  context.includes('join') || 
                  context.includes('enroll') || 
                  context.includes('apply')) {
                data.registration_link = cleanUrl;
              } else if (!data.website_url) {
                data.website_url = cleanUrl;
              }
            }
          }
        }
      }
      
      // Extract registration link
      const registrationMatch = text.match(/registration[:\s]+([^\n]+)/i) || text.match(/register at[:\s]+([^\n]+)/i);
      if (registrationMatch && registrationMatch[1]) {
        data.registration_link = registrationMatch[1].trim();
      }
      
      // Extract application method
      const applicationMatch = text.match(/how to apply[:\s]+([^\n]+)/i) || text.match(/apply by[:\s]+([^\n]+)/i);
      if (applicationMatch && applicationMatch[1]) {
        data.application_method = applicationMatch[1].trim();
      }
      
      // Extract additional details
      const additionalMatch = text.match(/additional details[:\s]+([^\n]+)/i) || text.match(/additional info[:\s]+([^\n]+)/i);
      if (additionalMatch && additionalMatch[1]) {
        data.additional_details = additionalMatch[1].trim();
      }
    } else {
      // Extract type
      const typeMatch = text.match(/type[:\s]+([^\n]+)/i);
      if (typeMatch && typeMatch[1]) {
        data.type = typeMatch[1].trim();
      }
      
      // Extract subject
      const subjectMatch = text.match(/subject[:\s]+([^\n]+)/i);
      if (subjectMatch && subjectMatch[1]) {
        data.subject = subjectMatch[1].trim();
      }
      
      // Extract url
      const urlMatch = text.match(/url[:\s]+([^\n]+)/i);
      if (urlMatch && urlMatch[1]) {
        data.url = urlMatch[1].trim();
      } else {
        // Try to find URLs in the text
        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
          data.url = urlMatch[0].trim();
        }
      }
    }
    
    return data;
  };

  // Generate mock event data from text input
  const generateMockEventFromText = (text: string): any => {
    const lowerText = text.toLowerCase();
    const result: any = {};
    
    // Extract title from text or use a default
    if (text.length > 50) {
      result.title = capitalizeFirstLetters(text.substring(0, 50) + '...');
    } else {
      result.title = capitalizeFirstLetters(text);
    }
    
    // Use text as description
    result.description = text;
    
    // Generate a date (default to next week)
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 7);
    dateObj.setHours(15, 0);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    result.date = `${year}-${month}-${day} ${hours}:${minutes}`;
    
    // Add time field for Supabase
    result.time = `${hours}:${minutes}:00`;
    
    // Set location
    result.location = 'Main Campus';
    
    // Determine category based on text
    if (lowerText.includes('workshop')) {
      result.category = 'Workshop';
    } else if (lowerText.includes('seminar')) {
      result.category = 'Seminar';
    } else if (lowerText.includes('sport') || lowerText.includes('game')) {
      result.category = 'Sports';
    } else if (lowerText.includes('cultural') || lowerText.includes('music') || lowerText.includes('dance')) {
      result.category = 'Cultural';
    } else if (lowerText.includes('lecture') || lowerText.includes('class')) {
      result.category = 'Academic';
    } else if (lowerText.includes('party') || lowerText.includes('social')) {
      result.category = 'Social';
    } else {
      result.category = 'Other';
    }
    
    // Extract additional information from text
    
    // Look for contact information
    const contactPatterns = [
      /contact[:\s]+([^,.]+)/i,
      /contact info[:\s]+([^,.]+)/i,
      /contact person[:\s]+([^,.]+)/i,
      /email[:\s]+([^,.]+)/i,
      /phone[:\s]+([^,.]+)/i,
      /call[:\s]+([^,.]+)/i,
    ];
    
    for (const pattern of contactPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.contact_info = match[1].trim();
        break;
      }
    }
    
    // Look for website URLs
    const urlRegex = /(https?:\/\/[^\s*]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Check each URL to determine if it's a registration link or website
      for (const url of urls) {
        // Clean up the URL (remove trailing punctuation, etc.)
        const cleanUrl = url.replace(/[.,;:!?*]*$/, '');
        
        // Check if this URL is mentioned near registration-related words
        const urlIndex = text.indexOf(url);
        if (urlIndex !== -1) {
          const contextStart = Math.max(0, urlIndex - 50);
          const contextEnd = Math.min(text.length, urlIndex + 50);
          const context = text.substring(contextStart, contextEnd).toLowerCase();
          
          if (context.includes('register') || 
              context.includes('sign up') || 
              context.includes('join') || 
              context.includes('enroll') || 
              context.includes('apply')) {
            result.registration_link = cleanUrl;
          } else if (!result.website_url) {
            result.website_url = cleanUrl;
          }
        }
      }
      
      // If we found URLs but didn't categorize them, use the first one as website
      if (urls.length > 0 && !result.website_url && !result.registration_link) {
        result.website_url = urls[0].replace(/[.,;:!?*]*$/, '');
      }
    }
    
    // Look for organizer information
    const organizerPatterns = [
      /organized by[:\s]+([^,.]+)/i,
      /organizer[:\s]+([^,.]+)/i,
      /hosted by[:\s]+([^,.]+)/i,
      /presented by[:\s]+([^,.]+)/i,
    ];
    
    for (const pattern of organizerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.organizer = match[1].trim();
        break;
      }
    }
    
    // Look for application methods
    const applicationPatterns = [
      /how to apply[:\s]+([^,.]+)/i,
      /apply by[:\s]+([^,.]+)/i,
      /application process[:\s]+([^,.]+)/i,
      /register by[:\s]+([^,.]+)/i,
    ];
    
    for (const pattern of applicationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.application_method = match[1].trim();
        break;
      }
    }
    
    return result;
  };
  
  // Generate mock resource data from text input
  const generateMockResourceFromText = (text: string): any => {
    const lowerText = text.toLowerCase();
    const result: any = {};
    
    // Extract title from text or use a default
    if (text.length > 50) {
      result.title = capitalizeFirstLetters(text.substring(0, 50) + '...');
    } else {
      result.title = capitalizeFirstLetters(text);
    }
    
    // Use text as description
    result.description = text;
    
    // Determine type based on text
    if (lowerText.includes('test') || lowerText.includes('exam')) {
      result.type = 'Test Paper';
    } else if (lowerText.includes('timetable') || lowerText.includes('schedule')) {
      result.type = 'Timetable';
    } else {
      result.type = 'Notes';
    }
    
    // Determine subject based on text
    if (lowerText.includes('math')) {
      result.subject = 'Mathematics';
    } else if (lowerText.includes('computer') || lowerText.includes('programming')) {
      result.subject = 'Computer Science';
    } else if (lowerText.includes('physics')) {
      result.subject = 'Physics';
    } else if (lowerText.includes('chemistry')) {
      result.subject = 'Chemistry';
    } else if (lowerText.includes('biology')) {
      result.subject = 'Biology';
    } else {
      result.subject = 'General';
    }
    
    // Generate a mock URL
    result.url = `https://example.com/resources/${result.type.toLowerCase().replace(/\s+/g, '-')}/${result.subject.toLowerCase().replace(/\s+/g, '-')}`;
    
    return result;
  };

  const validateEventData = (data: any) => {
    const result = { ...data };
    
    // Ensure title is present and capitalized
    if (!result.title) {
      result.title = 'Untitled Event';
    } else {
      result.title = capitalizeFirstLetters(result.title);
    }
    
    // Format date if provided but not in correct format
    if (!result.date || !result.date.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
      try {
        // Try to parse and format the date
        const dateObj = new Date(result.date || Date.now() + 86400000 * 7); // Default to 7 days from now
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          result.date = `${year}-${month}-${day} ${hours}:${minutes}`;
        }
      } catch (e) {
        // If date parsing fails, use current date + 7 days
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + 7);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        result.date = `${year}-${month}-${day} ${hours}:${minutes}`;
      }
    }
    
    // Ensure description is present
    if (!result.description) {
      result.description = 'No description provided.';
    }
    
    // Ensure category is valid
    if (!result.category || !EVENT_CATEGORIES.includes(result.category)) {
      // Try to determine category from title or description
      const lowerTitle = (result.title || '').toLowerCase();
      const lowerDesc = (result.description || '').toLowerCase();
      
      if (lowerTitle.includes('workshop') || lowerDesc.includes('workshop')) {
        result.category = 'Workshop';
      } else if (lowerTitle.includes('seminar') || lowerDesc.includes('seminar')) {
        result.category = 'Seminar';
      } else if (lowerTitle.includes('sport') || lowerDesc.includes('sport') || 
                lowerTitle.includes('game') || lowerDesc.includes('game')) {
        result.category = 'Sports';
      } else if (lowerTitle.includes('cultural') || lowerDesc.includes('cultural') || 
                lowerTitle.includes('music') || lowerDesc.includes('music') || 
                lowerTitle.includes('dance') || lowerDesc.includes('dance')) {
        result.category = 'Cultural';
      } else if (lowerTitle.includes('lecture') || lowerDesc.includes('lecture') || 
                lowerTitle.includes('class') || lowerDesc.includes('class')) {
        result.category = 'Academic';
      } else if (lowerTitle.includes('party') || lowerDesc.includes('party') || 
                lowerTitle.includes('social') || lowerDesc.includes('social')) {
        result.category = 'Social';
      } else {
        result.category = 'Other';
      }
    }
    
    // Ensure location is provided
    if (!result.location) {
      result.location = 'Main Campus';
    }
    
    return result;
  };

  const validateResourceData = (data: any) => {
    const result = { ...data };
    
    // Ensure title is present and capitalized
    if (!result.title) {
      result.title = 'Untitled Resource';
    } else {
      result.title = capitalizeFirstLetters(result.title);
    }
    
    // Ensure description is present
    if (!result.description) {
      result.description = 'No description provided.';
    }
    
    // Ensure type is valid
    if (!result.type || !RESOURCE_TYPES.includes(result.type)) {
      // Try to determine type from title or description
      const lowerTitle = (result.title || '').toLowerCase();
      const lowerDesc = (result.description || '').toLowerCase();
      
      if (lowerTitle.includes('test') || lowerDesc.includes('test') || 
          lowerTitle.includes('exam') || lowerDesc.includes('exam')) {
        result.type = 'Test Paper';
      } else if (lowerTitle.includes('timetable') || lowerDesc.includes('timetable') || 
                lowerTitle.includes('schedule') || lowerDesc.includes('schedule')) {
        result.type = 'Timetable';
      } else {
        result.type = 'Notes';
      }
    }
    
    // Ensure subject is provided
    if (!result.subject) {
      // Try to determine subject from title or description
      const lowerTitle = (result.title || '').toLowerCase();
      const lowerDesc = (result.description || '').toLowerCase();
      
      if (lowerTitle.includes('math') || lowerDesc.includes('math')) {
        result.subject = 'Mathematics';
      } else if (lowerTitle.includes('computer') || lowerDesc.includes('computer') || 
                lowerTitle.includes('programming') || lowerDesc.includes('programming')) {
        result.subject = 'Computer Science';
      } else if (lowerTitle.includes('physics') || lowerDesc.includes('physics')) {
        result.subject = 'Physics';
      } else if (lowerTitle.includes('chemistry') || lowerDesc.includes('chemistry')) {
        result.subject = 'Chemistry';
      } else if (lowerTitle.includes('biology') || lowerDesc.includes('biology')) {
        result.subject = 'Biology';
      } else {
        result.subject = 'General';
      }
    }
    
    // Ensure URL is provided
    if (!result.url) {
      result.url = 'https://example.com/resources';
    }
    
    return result;
  };

  /**
   * Capitalize the first letter of each word in a string
   * @param str String to capitalize
   * @returns Capitalized string
   */
  const capitalizeFirstLetters = (str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSubmit = async () => {
    // Dismiss keyboard to prevent it from getting stuck
    if (Platform && Platform.OS !== 'web') {
      try {
        const { Keyboard } = require('react-native');
        Keyboard.dismiss();
      } catch (error) {
        console.error('Error dismissing keyboard:', error);
      }
    }
    
    if (!useNaturalLanguage && !formData.title) {
      Alert.alert('Missing Information', 'Please fill in at least the title field.');
      return;
    }
    
    if (useNaturalLanguage && !naturalLanguageInput) {
      Alert.alert('Missing Information', 'Please enter a description of the item you want to add.');
      return;
    }
    
    setLoading(true);
    try {
      // Process data with AI
      const processedData = await processWithAI(formData, dialogType);
      
      // Create a new item with a UUID
      const newItem = {
        ...processedData,
        created_at: new Date().toISOString(),
      };
      
      if (dialogType === 'event') {
        // Extract time from date for Supabase
        if (newItem.date) {
          try {
            const dateObj = new Date(newItem.date);
            if (!isNaN(dateObj.getTime())) {
              // Format time as HH:MM:SS
              const hours = String(dateObj.getHours()).padStart(2, '0');
              const minutes = String(dateObj.getMinutes()).padStart(2, '0');
              const seconds = String(dateObj.getSeconds()).padStart(2, '0');
              newItem.time = `${hours}:${minutes}:${seconds}`;
            }
          } catch (error) {
            console.error('Error extracting time from date:', error);
            newItem.time = '15:00:00'; // Default to 3 PM
          }
        } else {
          newItem.time = '15:00:00'; // Default to 3 PM
        }
        
        // Store additional fields in the description if they exist
        const additionalFields = [];
        if (newItem.organizer) additionalFields.push(`Organizer: ${newItem.organizer}`);
        if (newItem.contact_info) additionalFields.push(`Contact: ${newItem.contact_info}`);
        if (newItem.website_url) additionalFields.push(`Website: ${newItem.website_url}`);
        if (newItem.registration_link) additionalFields.push(`Registration: ${newItem.registration_link}`);
        if (newItem.application_method) additionalFields.push(`How to apply: ${newItem.application_method}`);
        if (newItem.additional_details) additionalFields.push(`Additional info: ${newItem.additional_details}`);
        
        // Check if there are already URLs in the description
        if (!newItem.website_url && !newItem.registration_link) {
          // Look for URLs in the description
          const urlRegex = /(https?:\/\/[^\s*]+)/g;
          const urls = newItem.description.match(urlRegex);
          
          if (urls && urls.length > 0) {
            // Check each URL to determine if it's a registration link or website
            for (const url of urls) {
              // Clean up the URL (remove trailing punctuation, etc.)
              const cleanUrl = url.replace(/[.,;:!?*]*$/, '');
              
              // Check if this URL is mentioned near registration-related words
              const urlIndex = newItem.description.indexOf(url);
              if (urlIndex !== -1) {
                const contextStart = Math.max(0, urlIndex - 50);
                const contextEnd = Math.min(newItem.description.length, urlIndex + 50);
                const context = newItem.description.substring(contextStart, contextEnd).toLowerCase();
                
                if (context.includes('register') || 
                    context.includes('sign up') || 
                    context.includes('join') || 
                    context.includes('enroll') || 
                    context.includes('apply')) {
                  additionalFields.push(`Registration: ${cleanUrl}`);
                } else if (!newItem.website_url) {
                  additionalFields.push(`Website: ${cleanUrl}`);
                }
              }
            }
            
            // If no registration link was found, use the first URL as website
            if (!additionalFields.some(field => field.startsWith('Registration:')) && 
                !additionalFields.some(field => field.startsWith('Website:'))) {
              additionalFields.push(`Website: ${urls[0].replace(/[.,;:!?*]*$/, '')}`);
            }
          }
        }
        
        if (additionalFields.length > 0) {
          // Append additional fields to the description
          newItem.description = `${newItem.description}\n\n${additionalFields.join('\n')}`;
        }
        
        // Filter out fields that might not exist in the database schema
        const safeItem = {
          title: newItem.title,
          description: newItem.description,
          date: newItem.date,
          time: newItem.time,
          location: newItem.location,
          category: newItem.category,
          created_at: newItem.created_at
        };
        
        console.log('Submitting event with data:', safeItem);
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('events')
          .insert(safeItem)
          .select();
          
        if (error) throw error;
        
        // Update local state with the returned data (which includes the generated ID)
        if (data && data.length > 0) {
          const updatedEvents = [data[0], ...events];
          setEvents(updatedEvents);
        }
      } else {
        // Filter out fields that might not exist in the database schema
        const safeItem = {
          title: newItem.title,
          description: newItem.description,
          type: newItem.type,
          subject: newItem.subject,
          url: newItem.url,
          created_at: newItem.created_at
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('resources')
          .insert(safeItem)
          .select();
          
        if (error) throw error;
        
        // Update local state with the returned data (which includes the generated ID)
        if (data && data.length > 0) {
          const updatedResources = [data[0], ...resources];
          setResources(updatedResources);
        }
      }
      
      setDialogVisible(false);
      Alert.alert('Success', `${dialogType === 'event' ? 'Event' : 'Resource'} added successfully.`);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', `Failed to add ${dialogType}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderEventForm = () => (
    <>
      {useNaturalLanguage ? (
        <TextInput
          label="Describe the event in natural language"
          value={naturalLanguageInput}
          onChangeText={setNaturalLanguageInput}
          mode="outlined"
          multiline
          numberOfLines={5}
          blurOnSubmit={true}
          returnKeyType="done"
          onSubmitEditing={() => {
            // This helps ensure the keyboard dismisses properly
            if (processingAI) return;
          }}
          editable={!processingAI}
          placeholder="Example: A tech workshop on AI development happening next Friday at 3 PM in the Computer Science building. Contact John at john@example.com to register. Visit workshop.example.com for more details."
          style={styles.input}
        />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            label="Title"
            value={formData.title || ''}
            onChangeText={(text) => handleFormChange('title', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={formData.description || ''}
            onChangeText={(text) => handleFormChange('description', text)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label="Date (YYYY-MM-DD HH:MM)"
            value={formData.date || ''}
            onChangeText={(text) => handleFormChange('date', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Location"
            value={formData.location || ''}
            onChangeText={(text) => handleFormChange('location', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Category"
            value={formData.category || ''}
            onChangeText={(text) => handleFormChange('category', text)}
            mode="outlined"
            style={styles.input}
          />
          
          <Button 
            mode="outlined" 
            onPress={() => setShowAdditionalFields(!showAdditionalFields)}
            style={styles.toggleButton}
            icon={showAdditionalFields ? "chevron-up" : "chevron-down"}
          >
            {showAdditionalFields ? "Hide Additional Details" : "Show Additional Details"}
          </Button>
          
          {showAdditionalFields && (
            <>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <TextInput
                label="Organizer"
                value={formData.organizer || ''}
                onChangeText={(text) => handleFormChange('organizer', text)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Contact Information"
                value={formData.contact_info || ''}
                onChangeText={(text) => handleFormChange('contact_info', text)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Website URL"
                value={formData.website_url || ''}
                onChangeText={(text) => handleFormChange('website_url', text)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Registration Link"
                value={formData.registration_link || ''}
                onChangeText={(text) => handleFormChange('registration_link', text)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="How to Apply"
                value={formData.application_method || ''}
                onChangeText={(text) => handleFormChange('application_method', text)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Additional Details"
                value={formData.additional_details || ''}
                onChangeText={(text) => handleFormChange('additional_details', text)}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
              />
            </>
          )}
        </>
      )}
      <Button 
        mode="text" 
        onPress={() => setUseNaturalLanguage(!useNaturalLanguage)}
        style={styles.switchButton}
      >
        Switch to {useNaturalLanguage ? 'Form Input' : 'Natural Language Input'}
      </Button>
    </>
  );

  const renderResourceForm = () => (
    <>
      {useNaturalLanguage ? (
        <TextInput
          label="Describe the resource in natural language"
          value={naturalLanguageInput}
          onChangeText={setNaturalLanguageInput}
          mode="outlined"
          multiline
          numberOfLines={5}
          blurOnSubmit={true}
          returnKeyType="done"
          onSubmitEditing={() => {
            // This helps ensure the keyboard dismisses properly
            if (processingAI) return;
          }}
          editable={!processingAI}
          placeholder="Example: Calculus I final exam practice questions with solutions for Mathematics students."
          style={styles.input}
        />
      ) : (
        <>
          <TextInput
            label="Title"
            value={formData.title || ''}
            onChangeText={(text) => handleFormChange('title', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={formData.description || ''}
            onChangeText={(text) => handleFormChange('description', text)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label="Type"
            value={formData.type || ''}
            onChangeText={(text) => handleFormChange('type', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Subject"
            value={formData.subject || ''}
            onChangeText={(text) => handleFormChange('subject', text)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="URL"
            value={formData.url || ''}
            onChangeText={(text) => handleFormChange('url', text)}
            mode="outlined"
            style={styles.input}
          />
        </>
      )}
      <Button 
        mode="text" 
        onPress={() => setUseNaturalLanguage(!useNaturalLanguage)}
        style={styles.switchButton}
      >
        Switch to {useNaturalLanguage ? 'Form Input' : 'Natural Language Input'}
      </Button>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.safeAreaTop} />
      <View style={styles.header}>
        <View style={styles.headerLeftSection}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Admin Dashboard</Text>
        </View>
        <Button 
          mode="contained" 
          onPress={handleLogout} 
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonLabel}
          compact={true}
        >
          Logout
        </Button>
      </View>

      <Card style={styles.userCard}>
        <Card.Content>
          <Title>Welcome, {userInfo?.email}</Title>
          <Text>Role: Admin</Text>
        </Card.Content>
      </Card>

      <View style={styles.tabContainer}>
        <Button 
          mode={activeTab === 0 ? "contained" : "outlined"} 
          onPress={() => setActiveTab(0)}
          style={styles.tabButton}
        >
          Events
        </Button>
        <Button 
          mode={activeTab === 1 ? "contained" : "outlined"} 
          onPress={() => setActiveTab(1)}
          style={styles.tabButton}
        >
          Resources
        </Button>
      </View>

      {activeTab === 0 ? (
        <ScrollView style={styles.content} horizontal={true}>
          <DataTable style={styles.dataTable}>
            <DataTable.Header>
              <DataTable.Title style={styles.tableCellTitle}>Title</DataTable.Title>
              <DataTable.Title style={styles.tableCellDate}>Date</DataTable.Title>
              <DataTable.Title style={styles.tableCellCategory}>Category</DataTable.Title>
              <DataTable.Title style={styles.tableCellAction}>Actions</DataTable.Title>
            </DataTable.Header>

            {events.map((event) => (
              <DataTable.Row key={event.id}>
                <DataTable.Cell style={styles.tableCellTitle}>{event.title}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellDate}>{new Date(event.date).toLocaleDateString()}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellCategory}>{event.category}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellAction}>
                  <View style={styles.actionButtonContainer}>
                    <IconButton 
                      icon="delete" 
                      onPress={() => handleDelete(event.id, 'event')} 
                      size={20}
                    />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} horizontal={true}>
          <DataTable style={styles.dataTable}>
            <DataTable.Header>
              <DataTable.Title style={styles.tableCellTitle}>Title</DataTable.Title>
              <DataTable.Title style={styles.tableCellType}>Type</DataTable.Title>
              <DataTable.Title style={styles.tableCellSubject}>Subject</DataTable.Title>
              <DataTable.Title style={styles.tableCellAction}>Actions</DataTable.Title>
            </DataTable.Header>

            {resources.map((resource) => (
              <DataTable.Row key={resource.id}>
                <DataTable.Cell style={styles.tableCellTitle}>{resource.title}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellType}>{resource.type}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellSubject}>{resource.subject}</DataTable.Cell>
                <DataTable.Cell style={styles.tableCellAction}>
                  <View style={styles.actionButtonContainer}>
                    <IconButton 
                      icon="delete" 
                      onPress={() => handleDelete(resource.id, 'resource')} 
                      size={20}
                    />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => openAddDialog(activeTab === 0 ? 'event' : 'resource')}
      />

      {dialogVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {dialogType === 'event' ? 'Event' : 'Resource'}</Text>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              {dialogType === 'event' ? renderEventForm() : renderResourceForm()}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button 
                onPress={handleSubmit} 
                loading={processingAI || loading}
                disabled={processingAI || loading}
              >
                {processingAI ? 'Processing with AI...' : 'Save'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Add padding for status bar
  },
  safeAreaTop: {
    height: Platform.OS === 'ios' ? 44 : 24, // Height for status bar
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    elevation: 2,
    flexWrap: 'nowrap',
    zIndex: 10,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
  },
  logoutButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
  },
  userCard: {
    margin: 16,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dataTable: {
    minWidth: '100%',
  },
  tableCellTitle: {
    minWidth: 150,
    paddingHorizontal: 8,
    flex: 3,
  },
  tableCellDate: {
    minWidth: 100,
    paddingHorizontal: 8,
    flex: 2,
  },
  tableCellCategory: {
    minWidth: 100,
    paddingHorizontal: 8,
    flex: 2,
  },
  tableCellType: {
    minWidth: 100,
    paddingHorizontal: 8,
    flex: 2,
  },
  tableCellSubject: {
    minWidth: 100,
    paddingHorizontal: 8,
    flex: 2,
  },
  tableCellAction: {
    minWidth: 70,
    paddingHorizontal: 0,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  switchButton: {
    marginBottom: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 8,
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.primary,
  },
  toggleButton: {
    marginVertical: 16,
    borderColor: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});