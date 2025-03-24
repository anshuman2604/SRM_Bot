import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, Alert, Share as RNShare, Clipboard, Dimensions, Image } from 'react-native';
import { Card, Title, Text, Button, ActivityIndicator, IconButton, Surface, Chip, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, EVENT_CATEGORIES } from '../../constants/Config';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image_url?: string;
  time?: string;
}

// Particle animation component
const ParticleBackground = () => {
  const particles = Array(20).fill(0).map((_, i) => {
    const animation = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const randomDuration = 3000 + Math.random() * 2000;
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: randomDuration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -50],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 0],
    });

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          {
            left: `${Math.random() * 100}%`,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      />
    );
  });

  return <View style={styles.particleContainer}>{particles}</View>;
};

// Event Card Component with Animation
const EventCard = ({ item, isExpanded, toggleEventDetails, handleAddToCalendar, handleShare, formatDate }: { 
  item: Event, 
  isExpanded: boolean, 
  toggleEventDetails: (id: string) => void,
  handleAddToCalendar: (event: Event) => void,
  handleShare: (event: Event) => void,
  formatDate: (date: string, time?: string) => string
}) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Configure the animation
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    
    // Animate the dropdown arrow rotation
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate the content height and opacity
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);
  
  // Interpolate rotation for the dropdown arrow
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  // Get category color based on category name
  const getCategoryColor = (category: string) => {
    const colors = {
      'Academic': '#4285F4',
      'Social': '#EA4335',
      'Sports': '#34A853',
      'Cultural': '#FBBC05',
      'Workshop': '#8E44AD',
      'Seminar': '#16A085',
      'Other': '#607D8B'
    };
    return colors[category as keyof typeof colors] || COLORS.primary;
  };
  
  const categoryColor = getCategoryColor(item.category);
  
  return (
    <View style={styles.cardOuterWrapper}>
      <Card style={styles.eventCard}>
        <View style={styles.innerCardWrapper}>
          <TouchableOpacity 
            onPress={() => toggleEventDetails(item.id)}
            style={styles.cardHeader}
          >
            <View style={styles.titleContainer}>
              <Title style={styles.eventTitle}>{item.title}</Title>
              <Chip 
                style={[styles.categoryChip, { backgroundColor: categoryColor }]}
                textStyle={styles.categoryChipText}
              >
                {item.category}
              </Chip>
            </View>
            
            <View style={styles.summaryContainer}>
              <View style={styles.metaItem}>
                <IconButton icon="calendar" size={20} iconColor={COLORS.text} style={styles.metaIcon} />
                <Text style={styles.metaText}>{formatDate(item.date, item.time)}</Text>
              </View>
              
              <Animated.View style={{ transform: [{ rotate }] }}>
                <IconButton 
                  icon="chevron-down" 
                  size={24} 
                  iconColor={COLORS.text}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>
          
          {/* Expanded Content */}
          {isExpanded && (
            <Animated.View 
              style={[
                styles.expandedDetails,
                { opacity: animatedOpacity }
              ]}
            >
              <View style={styles.detailsContainer}>
                <View style={styles.metaItem}>
                  <IconButton icon="map-marker" size={20} iconColor={COLORS.text} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>About this event:</Text>
                  <Text style={styles.eventDescription}>{item.description}</Text>
                </View>
                
                <View style={styles.cardActions}>
                  <Button
                    mode="contained"
                    onPress={() => handleAddToCalendar(item)}
                    style={styles.calendarButton}
                    labelStyle={styles.calendarButtonText}
                    icon="calendar-plus"
                  >
                    Add to Calendar
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleShare(item)}
                    style={styles.shareButton}
                    labelStyle={{ color: getCategoryColor(item.category) }}
                    icon="share-variant"
                  >
                    Share
                  </Button>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </Card>
    </View>
  );
};

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    fetchEvents();
    requestCalendarPermissions();
  }, []);

  useEffect(() => {
    // Apply category filter
    if (selectedCategory) {
      const filtered = events.filter((event) => event.category === selectedCategory);
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [events, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Fetched events:', data.length);
        setEvents(data);
        setFilteredEvents(data);
      } else {
        console.log('No events found');
        setEvents([]);
        setFilteredEvents([]);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message || 'Failed to fetch events');
      // If there's an error, show mock data
      const mockData = getMockEvents();
      setEvents(mockData);
      setFilteredEvents(mockData);
    } finally {
      setLoading(false);
    }
  };

  const requestCalendarPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        console.log('Calendars:', calendars);
      }
    }
  };

  const addToCalendar = async (event: Event) => {
    try {
      if (Platform.OS === 'web') {
        // For web, create a Google Calendar link
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${encodeURIComponent(event.date)}`;
        await Linking.openURL(googleCalendarUrl);
        setSnackbarMessage('Opening Google Calendar...');
        setSnackbarVisible(true);
        return;
      }

      // Request calendar permissions if not on web
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow calendar access to add events.');
        return;
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        throw new Error('No calendar found');
      }

      // Parse event date
      const eventDate = new Date(event.date);
      const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours duration

      // Create calendar event
      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        location: event.location,
        notes: event.description,
        startDate: eventDate,
        endDate: endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }], // Alert 1 hour before
      });

      setSnackbarMessage('Event added to calendar');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      setSnackbarMessage('Failed to add event to calendar');
      setSnackbarVisible(true);
    }
  };

  const handleShare = async (event: Event) => {
    try {
      const eventDate = formatDate(event.date, event.time);
      const message = `Check out this event: ${event.title}\n\nDate: ${eventDate}\nLocation: ${event.location}\n\n${event.description}`;
      
      if (Platform.OS === 'web') {
        // For web browsers
        if (navigator.share) {
          await navigator.share({
            title: event.title,
            text: message,
            url: window.location.href,
          });
        } else {
          // Fallback for browsers without share API
          await Clipboard.setString(message);
          setSnackbarMessage('Event details copied to clipboard');
          setSnackbarVisible(true);
        }
      } else {
        // For mobile platforms
        try {
          const result = await RNShare.share({
            message,
            title: event.title,
          });
          
          if (result.action === RNShare.sharedAction) {
            setSnackbarMessage('Event shared successfully!');
            setSnackbarVisible(true);
          }
        } catch (shareError) {
          // Fallback to clipboard
          await Clipboard.setString(message);
          setSnackbarMessage('Event details copied to clipboard');
          setSnackbarVisible(true);
        }
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      setSnackbarMessage('Failed to share event. Details copied to clipboard instead.');
      setSnackbarVisible(true);
    }
  };

  const handleCategorySelect = (category: string) => {
    // Configure animation for category change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const toggleEventDetails = (eventId: string) => {
    // Configure animation for expanding/collapsing
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === eventId ? null : eventId);
  };

  const formatDate = (dateString: string, timeString?: string): string => {
    try {
      let dateTimeString = dateString;
      if (timeString && dateString.indexOf(':') === -1) {
        dateTimeString = `${dateString} ${timeString}`;
      }
      
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, { dateString, timeString });
      return dateString;
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      item={item}
      isExpanded={expandedId === item.id}
      toggleEventDetails={toggleEventDetails}
      handleAddToCalendar={addToCalendar}
      handleShare={handleShare}
      formatDate={formatDate}
    />
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <ParticleBackground />
        
        <View style={styles.header}>
          <Text style={styles.title}>Campus Events</Text>
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {EVENT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton,
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.selectedCategoryButtonText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Button mode="contained" onPress={fetchEvents}>Try Again</Button>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No events found</Text>
            <Button mode="contained" onPress={fetchEvents}>Refresh</Button>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.eventsList}
          />
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_SHORT}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </View>
  );
}

// Mock data for when the API is unavailable
const getMockEvents = (): Event[] => [
  {
    id: '1',
    title: 'Freshman Orientation',
    description: 'Welcome event for all new students. Learn about campus resources and meet fellow students.',
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    location: 'Main Auditorium',
    category: 'Academic',
  },
  {
    id: '2',
    title: 'Campus Music Festival',
    description: 'Annual music festival featuring student bands and professional artists.',
    date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    location: 'Central Quad',
    category: 'Cultural',
  },
  {
    id: '3',
    title: 'Career Fair',
    description: 'Meet recruiters from top companies and explore internship and job opportunities.',
    date: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
    location: 'Student Center',
    category: 'Workshop',
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 55 : 45,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    bottom: 0,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    zIndex: 1,
    width: '100%',
    marginTop: Platform.OS === 'android' ? 8 : 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: 4,
  },
  categoryContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  cardOuterWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    maxWidth: '100%',
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 3,
  },
  innerCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  metaIcon: {
    margin: 0,
    padding: 0,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryChip: {
    height: 28,
    maxWidth: '100%',
  },
  categoryChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  descriptionContainer: {
    marginVertical: 8,
  },
  descriptionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarButton: {
    flex: 1,
    minWidth: 140,
    marginRight: 8,
    backgroundColor: COLORS.primary,
  },
  calendarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  shareButton: {
    flex: 1,
    minWidth: 140,
    marginLeft: 8,
    borderColor: COLORS.border,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 8,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  eventsList: {
    paddingVertical: 8,
  },
}); 