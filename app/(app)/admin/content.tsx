import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform, TouchableOpacity, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Divider, TextInput, ActivityIndicator, SegmentedButtons, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS, RESOURCE_TYPES } from '../../../constants/Config';
import { AdminProtectedRoute } from '../../../components/AdminProtectedRoute';
import { supabase } from '../../../lib/supabase';

// Interfaces for data types
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: EventCategory;
  website_url?: string;
  organizer?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  subject: string;
  url: string;
}

type EventCategory = typeof EVENT_CATEGORIES[number];

// Define valid event categories
const EVENT_CATEGORIES = [
  'Academic',
  'Cultural',
  'Sports',
  'Club',
  'Career',
  'Other'
] as const;

/**
 * Content Management Screen
 * Allows admins to manage events and resources
 */
export default function ContentManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        // Get events from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) throw error;
        setEvents(data || []);
      } else {
        // Get resources from Supabase
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setResources(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const processWithAI = async () => {
    if (!naturalLanguageInput) {
      Alert.alert('Error', 'Please enter a description for the event');
      return;
    }

    setAiProcessing(true);
    
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
      // Generate event data from text input
      const eventData = extractDataFromText(naturalLanguageInput);
      setFormData(eventData);
      setAiResult('Event details generated successfully!');
    } catch (error) {
      console.error('AI processing error:', error);
      setAiResult('Failed to process input. Please try again or fill the form manually.');
    } finally {
      setAiProcessing(false);
    }
  };
  
  // Helper function to capitalize first letters
  const capitalizeFirstLetters = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Extract structured data from text
  const extractDataFromText = (text: string) => {
    const data: any = {};
    
    // Extract title
    const titlePatterns = [
      // Event name patterns
      /\b((?:\w+\s+)?\d{4}(?:\s+(?:event|festival|competition|tournament|conference|workshop|seminar))?)\b/i,
      /(?:presents|announcing|announcing:|presents:|proudly presents:?)\s+([^\n.!?]+)/i,
      /\b([^\n.!?]+(?:event|festival|competition|tournament|conference|workshop|seminar))\b/i,
      // Explicit title patterns
      /title[:\s]+([^\n.;]+)/i,
      /event[:\s]+([^\n.;]+)/i,
      /name[:\s]+([^\n.;]+)/i,
      /topic[:\s]+([^\n.;]+)/i,
      /subject[:\s]+([^\n.;]+)/i,
    ];
    
    // Common greetings and introductory phrases to ignore
    const greetings = [
      /^dear\s+(?:students?|friends?|colleagues?|all|everyone|sir|madam)/i,
      /^hi(?:\s+(?:all|everyone|there))?\s*[,.]?/i,
      /^hello(?:\s+(?:all|everyone|there))?\s*[,.]?/i,
      /^greetings\s*[,.]?/i,
      /^good\s+(?:morning|afternoon|evening)\s*[,.]?/i,
      /^attention\s+(?:students?|all|everyone)\s*[,.]?/i,
      /^to\s+(?:all|whom\s+it\s+may\s+concern)\s*[,.]?/i,
    ];
    
    let foundTitle = false;
    
    // First try to find event name patterns
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
      // Skip if line starts with a greeting
      if (greetings.some(pattern => line.trim().match(pattern))) {
        continue;
      }
      
      // Try each title pattern
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const potentialTitle = match[1].trim();
          // Check if it's not just a date or common word
          if (potentialTitle.length > 3 && !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(potentialTitle)) {
            data.title = capitalizeFirstLetters(potentialTitle);
            foundTitle = true;
            break;
          }
        }
      }
      if (foundTitle) break;
    }
    
    // If no title found yet, try to find the first meaningful line
    if (!foundTitle) {
      for (const line of lines) {
        // Skip greetings and empty lines
        if (line.trim() && !greetings.some(pattern => line.trim().match(pattern))) {
          data.title = capitalizeFirstLetters(
            line.length > 50 ? line.substring(0, 47) + '...' : line
          );
          foundTitle = true;
          break;
        }
      }
    }
    
    // If still no title found, use default
    if (!data.title) {
      data.title = 'New Event';
    }
    
    // Use full text as description
    data.description = text;
    
    // Try to extract a more specific description if available
    const descPatterns = [
      /description[:\s]+([^\n]+)/i,
      /about[:\s]+([^\n]+)/i,
      /details[:\s]+([^\n]+)/i,
    ];
    
    for (const pattern of descPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.description = match[1].trim();
        break;
      }
    }
    
    // Extract and parse date
    const datePatterns = [
      // ISO format
      /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
      // DD/MM/YYYY or MM/DD/YYYY
      /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/,
      // Month DD, YYYY
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/i,
      // DD Month YYYY
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?)\b/i,
      // Month DD
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?)\b/i,
      // DD Month
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/i,
      // Explicit date labels
      /date:\s*([^\n.;]+)/i,
      /when:\s*([^\n.;]+)/i,
      /scheduled (?:for|on):\s*([^\n.;]+)/i,
      /will be held on:\s*([^\n.;]+)/i,
    ];
    
    let foundDate = false;
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const dateStr = match[1].trim();
          
          // Remove ordinal suffixes (st, nd, rd, th)
          const cleanDateStr = dateStr.replace(/(\d+)(?:st|nd|rd|th)/, '$1');
          
          // Handle different date formats
          let parsedDate;
          
          if (cleanDateStr.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
            // YYYY-MM-DD or YYYY/MM/DD
            parsedDate = new Date(cleanDateStr.replace(/\//g, '-'));
          } else if (cleanDateStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
            // DD/MM/YYYY or MM/DD/YYYY
            const [first, second, year] = cleanDateStr.split(/[-/]/);
            // Assume DD/MM/YYYY format
            parsedDate = new Date(`${year}-${second}-${first}`);
          } else {
            // Handle month names
            const monthMap: { [key: string]: number } = {
              'january': 0, 'february': 1, 'march': 2, 'april': 3,
              'may': 4, 'june': 5, 'july': 6, 'august': 7,
              'september': 8, 'october': 9, 'november': 10, 'december': 11
            };
            
            // Try "Month DD" or "DD Month" format
            const monthDayMatch = cleanDateStr.match(/(?:(\d{1,2})\s+)?([A-Za-z]+)(?:\s+(\d{1,2}))?\s*(?:\s+(\d{4}))?/i);
            
            if (monthDayMatch) {
              const day = monthDayMatch[1] || monthDayMatch[3];
              const monthStr = monthDayMatch[2].toLowerCase();
              const year = monthDayMatch[4] || new Date().getFullYear().toString();
              
              if (day && monthMap.hasOwnProperty(monthStr)) {
                parsedDate = new Date(
                  parseInt(year),
                  monthMap[monthStr],
                  parseInt(day)
                );
              }
            }
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            data.date = `${year}-${month}-${day}`;
            foundDate = true;
            break;
          }
        } catch (e) {
          console.log('Failed to parse date:', e);
          continue;
        }
      }
    }
    
    // If no date found or parsing failed, set to tomorrow
    if (!foundDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      data.date = `${year}-${month}-${day}`;
    }
    
    // Extract time if mentioned
    const timePatterns = [
      /at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
      /from\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
      /time:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
      /(\d{1,2}:\d{2})/,  // 24-hour format
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const timeStr = match[1].trim();
          let hours = 0;
          let minutes = 0;
          
          if (timeStr.match(/:/)) {
            // Handle HH:MM format
            const [h, m] = timeStr.split(':');
            hours = parseInt(h);
            minutes = parseInt(m);
            
            // Handle AM/PM
            if (timeStr.toLowerCase().includes('pm') && hours < 12) {
              hours += 12;
            }
          } else {
            // Handle simple hour format
            hours = parseInt(timeStr);
            if (timeStr.toLowerCase().includes('pm') && hours < 12) {
              hours += 12;
            }
          }
          
          data.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          break;
        } catch (e) {
          console.log('Failed to parse time:', e);
          continue;
        }
      }
    }
    
    // Default time to 3 PM if not specified
    if (!data.time) {
      data.time = '15:00';
    }
    
    // Extract location
    const locationPatterns = [
      /location[:\s]+([^\n.;]+)/i,
      /venue[:\s]+([^\n.;]+)/i,
      /place[:\s]+([^\n.;]+)/i,
      /at\s+([^\n.;,]+)(?=\s+on\s+|\s+at\s+|\s+from\s+|\s+till\s+|\s+until\s+|\s+to\s+)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.location = match[1].trim();
        break;
      }
    }
    
    if (!data.location) {
      data.location = 'Main Campus'; // Default location
    }
    
    // Extract category
    const categoryPatterns = [
      /category[:\s]+([^\n.;]+)/i,
      /type[:\s]+([^\n.;]+)/i,
      /event type[:\s]+([^\n.;]+)/i,
    ];
    
    let foundCategory = '';
    for (const pattern of categoryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        foundCategory = match[1].trim();
        break;
      }
    }
    
    if (foundCategory) {
      data.category = findClosestCategory(foundCategory);
    } else {
      // Try to infer category from keywords
      const categoryKeywords: Record<EventCategory, string[]> = {
        'Academic': ['lecture', 'seminar', 'workshop', 'conference', 'symposium', 'class', 'course', 'training', 'education'],
        'Cultural': ['cultural', 'dance', 'music', 'art', 'exhibition', 'performance', 'concert', 'festival', 'celebration'],
        'Sports': ['sports', 'game', 'match', 'tournament', 'competition', 'athletics', 'fitness', 'play', 'championship'],
        'Club': ['club', 'society', 'association', 'organization', 'committee', 'council', 'union', 'group', 'team'],
        'Career': ['career', 'job', 'placement', 'recruitment', 'interview', 'internship', 'employment', 'profession', 'hiring'],
        'Other': ['event', 'activity', 'program', 'function', 'gathering', 'meeting', 'session', 'occasion', 'ceremony']
      };
      
      const lowerText = text.toLowerCase();
      let bestCategory = '';
      let maxMatches = 0;
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const matches = keywords.filter(keyword => lowerText.includes(keyword.toLowerCase())).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestCategory = category as EventCategory;
        }
      }
      
      data.category = bestCategory || 'Other';
    }
    
    // Extract website URL
    const urlPatterns = [
      /website[:\s]+([^\s,;]+)/i,
      /website[:\s]+(https?:\/\/[^\s,;]+)/i,
      /url[:\s]+([^\s,;]+)/i,
      /link[:\s]+([^\s,;]+)/i,
      /visit[:\s]+([^\s,;]+)/i,
      /web[:\s]+([^\s,;]+)/i,
      /site[:\s]+([^\s,;]+)/i,
      /(https?:\/\/[^\s,;]+)/i,
      /www\.[^\s,;]+/i,
    ];

    for (const pattern of urlPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let url = match[1].trim();
        if (url.startsWith('www.')) {
          url = 'https://' + url;
        }
        try {
          new URL(url);
          data.website_url = url;
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    return data;
  };

  // Helper function to find the closest matching category
  const findClosestCategory = (input: string): EventCategory => {
    input = input.toLowerCase().trim();
    
    // Direct match
    const directMatch = EVENT_CATEGORIES.find(
      cat => cat.toLowerCase() === input
    );
    if (directMatch) return directMatch;
    
    // Check for substring matches
    const substringMatch = EVENT_CATEGORIES.find(
      cat => input.includes(cat.toLowerCase()) || cat.toLowerCase().includes(input)
    );
    if (substringMatch) return substringMatch;
    
    // Use keyword matching
    const categoryKeywords: Record<EventCategory, string[]> = {
      'Academic': ['lecture', 'seminar', 'workshop', 'conference', 'symposium', 'class', 'course', 'training', 'education'],
      'Cultural': ['cultural', 'dance', 'music', 'art', 'exhibition', 'performance', 'concert', 'festival', 'celebration'],
      'Sports': ['sports', 'game', 'match', 'tournament', 'competition', 'athletics', 'fitness', 'play', 'championship'],
      'Club': ['club', 'society', 'association', 'organization', 'committee', 'council', 'union', 'group', 'team'],
      'Career': ['career', 'job', 'placement', 'recruitment', 'interview', 'internship', 'employment', 'profession', 'hiring'],
      'Other': ['event', 'activity', 'program', 'function', 'gathering', 'meeting', 'session', 'occasion', 'ceremony']
    };
    
    let bestMatch = 'Other' as EventCategory;
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => input.includes(keyword.toLowerCase())).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category as EventCategory;
      }
    }
    
    return bestMatch;
  };

  const handleAddItem = async () => {
    if (activeTab === 'events' && (!formData.title || !formData.description || !formData.date || !formData.location || !formData.category)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    
    if (activeTab === 'resources' && (!formData.title || !formData.description || !formData.type || !formData.subject || !formData.url)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      if (activeTab === 'events') {
        // Extract time from date if it's in the format YYYY-MM-DD HH:MM
        let timeString = '';
        const dateMatch = formData.date.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
        if (dateMatch) {
          formData.date = dateMatch[1];
          timeString = dateMatch[2];
        }
        
        // Prepare event data
        const eventData = {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: timeString || formData.time || '',
          location: formData.location,
          category: formData.category,
          website_url: formData.website_url || '',
          organizer: formData.organizer || '',
        };
        
        if (formData.id) {
          // Update existing event
          const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', formData.id);
            
          if (error) {
            throw new Error(`Error updating event: ${JSON.stringify(error)}`);
          }
          
          Alert.alert('Success', 'Event updated successfully');
        } else {
          // Add new event
          const { error } = await supabase
            .from('events')
            .insert(eventData);
            
          if (error) {
            throw new Error(`Error adding event: ${JSON.stringify(error)}`);
          }
          
          Alert.alert('Success', 'Event added successfully');
        }
      } else if (activeTab === 'resources') {
        // Prepare resource data
        const resourceData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          subject: formData.subject,
          url: formData.url,
        };
        
        if (formData.id) {
          // Update existing resource
          const { error } = await supabase
            .from('resources')
            .update(resourceData)
            .eq('id', formData.id);
            
          if (error) {
            throw new Error(`Error updating resource: ${JSON.stringify(error)}`);
          }
          
          Alert.alert('Success', 'Resource updated successfully');
        } else {
          // Add new resource
          const { error } = await supabase
            .from('resources')
            .insert(resourceData);
            
          if (error) {
            throw new Error(`Error adding resource: ${JSON.stringify(error)}`);
          }
          
          Alert.alert('Success', 'Resource added successfully');
        }
      }
      
      // Reset form and refresh data
      setFormData({});
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error in handleAddItem:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${activeTab === 'events' ? 'event' : 'resource'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const { error } = await supabase
                .from(activeTab)
                .delete()
                .eq('id', id);
                
              if (error) {
                console.error(`Error deleting ${activeTab}:`, error);
                Alert.alert('Error', `Failed to delete ${activeTab}`);
                return;
              }
              
              fetchData();
              Alert.alert('Success', `${activeTab === 'events' ? 'Event' : 'Resource'} deleted successfully`);
            } catch (error) {
              console.error(`Error in handleDelete${activeTab}:`, error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleEditItem = (item: Event | Resource) => {
    setFormData(item);
    setShowAddForm(true);
  };

  const renderEventForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{formData.id ? 'Edit Event' : 'Add New Event'}</Title>
        
        <View style={styles.aiInputContainer}>
          <Title style={styles.sectionTitle}>AI Event Generator</Title>
          <Text style={styles.aiDescription}>
            Describe your event in natural language and let AI generate the details for you.
          </Text>
          
          <TextInput
            label="Describe your event"
            value={naturalLanguageInput}
            onChangeText={setNaturalLanguageInput}
            multiline
            numberOfLines={4}
            style={styles.aiInput}
            placeholder="E.g., Workshop on Machine Learning on March 15th at 3 PM in the Main Auditorium. Contact Prof. Smith for more details."
            onSubmitEditing={Keyboard.dismiss}
            blurOnSubmit={true}
          />
          
          <Button 
            mode="contained" 
            onPress={() => {
              Keyboard.dismiss();
              processWithAI();
            }}
            loading={aiProcessing}
            disabled={aiProcessing || !naturalLanguageInput}
            icon="robot"
            style={styles.aiButton}
          >
            Generate with AI
          </Button>
          
          {aiResult ? (
            <Text style={styles.aiResult}>{aiResult}</Text>
          ) : null}
          
          <Divider style={styles.divider} />
        </View>
        
        <TextInput
          label="Title *"
          value={formData.title || ''}
          onChangeText={(text) => handleFormChange('title', text)}
          style={styles.input}
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
        
        <TextInput
          label="Description *"
          value={formData.description || ''}
          onChangeText={(text) => handleFormChange('description', text)}
          multiline
          numberOfLines={4}
          style={styles.input}
          blurOnSubmit={true}
        />
        
        <TextInput
          label="Date (YYYY-MM-DD HH:MM) *"
          value={formData.date || ''}
          onChangeText={(text) => handleFormChange('date', text)}
          style={styles.input}
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
        
        <TextInput
          label="Location *"
          value={formData.location || ''}
          onChangeText={(text) => handleFormChange('location', text)}
          style={styles.input}
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
        
        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryButtons}>
            {EVENT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  formData.category === category && styles.categoryButtonSelected
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  handleFormChange('category', category);
                }}
              >
                <Text style={[
                  styles.categoryButtonText,
                  formData.category === category && styles.categoryButtonTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TextInput
          label="Website URL"
          value={formData.website_url || ''}
          onChangeText={(text) => handleFormChange('website_url', text)}
          style={styles.input}
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
        
        <TextInput
          label="Organizer"
          value={formData.organizer || ''}
          onChangeText={(text) => handleFormChange('organizer', text)}
          style={styles.input}
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
      </Card.Content>
      
      <Card.Actions>
        <Button onPress={() => {
          Keyboard.dismiss();
          setShowAddForm(false);
          setFormData({});
          setNaturalLanguageInput('');
          setAiResult('');
        }}>
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={() => {
            Keyboard.dismiss();
            handleAddItem();
          }}
          loading={loading}
          disabled={loading}
        >
          {formData.id ? 'Update Event' : 'Add Event'}
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderResourceForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{formData.id ? 'Edit Resource' : 'Add New Resource'}</Title>
        
        <TextInput
          label="Title *"
          value={formData.title || ''}
          onChangeText={(text) => handleFormChange('title', text)}
          style={styles.input}
        />
        
        <TextInput
          label="Description *"
          value={formData.description || ''}
          onChangeText={(text) => handleFormChange('description', text)}
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        
        <Text style={styles.inputLabel}>Type *</Text>
        <SegmentedButtons
          value={formData.type || RESOURCE_TYPES[0]}
          onValueChange={(value) => handleFormChange('type', value)}
          buttons={RESOURCE_TYPES.map(type => ({ value: type, label: type }))}
          style={styles.segmentedButtons}
        />
        
        <TextInput
          label="Subject *"
          value={formData.subject || ''}
          onChangeText={(text) => handleFormChange('subject', text)}
          style={styles.input}
        />
        
        <TextInput
          label="URL *"
          value={formData.url || ''}
          onChangeText={(text) => handleFormChange('url', text)}
          style={styles.input}
        />
      </Card.Content>
      
      <Card.Actions>
        <Button onPress={() => {
          setShowAddForm(false);
          setFormData({});
        }}>
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleAddItem}
          loading={loading}
          disabled={loading}
        >
          {formData.id ? 'Update Resource' : 'Add Resource'}
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderEvents = () => (
    <>
      {events.map((event) => (
        <Card key={event.id} style={styles.card}>
          <Card.Content>
            <Title>{event.title}</Title>
            <Paragraph style={styles.eventDate}>Date: {event.date}</Paragraph>
            <Paragraph style={styles.eventLocation}>
              Location: {event.location || 'TBD'}
            </Paragraph>
            <Paragraph>{event.description}</Paragraph>
            
            {event.website_url ? (
              <Paragraph style={styles.eventDetail}>Website URL: {event.website_url}</Paragraph>
            ) : null}
          </Card.Content>
          
          <Card.Actions>
            <Button 
              icon="pencil" 
              onPress={() => handleEditItem(event)}
            >
              Edit
            </Button>
            <Button 
              icon="delete" 
              onPress={() => handleDeleteItem(event.id)}
              textColor="#FF5252"
            >
              Delete
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </>
  );

  const renderResources = () => (
    <>
      {resources.map((resource) => (
        <Card key={resource.id} style={styles.card}>
          <Card.Content>
            <Title>{resource.title}</Title>
            <Paragraph style={styles.resourceType}>Type: {resource.type}</Paragraph>
            <Paragraph style={styles.resourceSubject}>Subject: {resource.subject}</Paragraph>
            <Paragraph>{resource.description}</Paragraph>
            <Paragraph style={styles.resourceUrl}>URL: {resource.url}</Paragraph>
          </Card.Content>
          
          <Card.Actions>
            <Button 
              icon="pencil" 
              onPress={() => handleEditItem(resource)}
            >
              Edit
            </Button>
            <Button 
              icon="delete" 
              onPress={() => handleDeleteItem(resource.id)}
              textColor="#FF5252"
            >
              Delete
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </>
  );

  return (
    <AdminProtectedRoute>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.innerContainer} onTouchStart={Keyboard.dismiss}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Content Management</Text>
            <Text style={styles.headerSubtitle}>Manage events, resources, and other content</Text>
          </View>

          <View style={styles.tabContainer}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'events', label: 'Events' },
                { value: 'resources', label: 'Resources' },
              ]}
            />
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            onScroll={() => {
              if (Keyboard.isVisible()) {
                Keyboard.dismiss();
              }
            }}
          >
            {showAddForm ? (
              activeTab === 'events' ? renderEventForm() : renderResourceForm()
            ) : (
              <Button 
                mode="contained" 
                icon="plus"
                onPress={() => {
                  setFormData({});
                  setShowAddForm(true);
                }}
                style={styles.addButton}
              >
                Add New {activeTab === 'events' ? 'Event' : 'Resource'}
              </Button>
            )}
            
            {loading && !showAddForm ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text>Loading content...</Text>
              </View>
            ) : (
              !showAddForm && (
                activeTab === 'events' ? (
                  events.length > 0 ? renderEvents() : (
                    <Card style={styles.card}>
                      <Card.Content>
                        <Text style={styles.emptyText}>No events found. Add your first event!</Text>
                      </Card.Content>
                    </Card>
                  )
                ) : (
                  resources.length > 0 ? renderResources() : (
                    <Card style={styles.card}>
                      <Card.Content>
                        <Text style={styles.emptyText}>No resources found. Add your first resource!</Text>
                      </Card.Content>
                    </Card>
                  )
                )
              )
            )}

            <Divider style={styles.divider} />

            <Button 
              mode="outlined" 
              icon="arrow-left"
              onPress={() => router.push('/admin/dashboard')}
              style={styles.backButton}
            >
              Back to Dashboard
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AdminProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding at the bottom to ensure content is visible when keyboard is open
    width: '100%',
  },
  card: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
    width: '100%',
  },
  addButton: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    color: COLORS.text,
    opacity: 0.7,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  eventDate: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  eventLocation: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  eventDetail: {
    marginTop: 4,
    fontSize: 14,
  },
  resourceType: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  resourceSubject: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  resourceUrl: {
    marginTop: 8,
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginBottom: 40,
  },
  aiInputContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aiDescription: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 16,
  },
  aiInput: {
    backgroundColor: COLORS.card,
    marginBottom: 16,
    minHeight: 100, // Ensure enough space for text input
  },
  aiButton: {
    marginBottom: 16,
  },
  aiResult: {
    fontSize: 14,
    color: COLORS.success,
    marginBottom: 16,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#333',
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: COLORS.text,
    opacity: 0.8,
  },
  descriptionInputWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  descriptionScrollView: {
    maxHeight: 150,
  },
  descriptionInput: {
    borderWidth: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
