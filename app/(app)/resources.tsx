import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, Linking, TouchableOpacity, Animated } from 'react-native';
import { Card, Title, Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { COLORS, RESOURCE_TYPES } from '../../constants/Config';
import { supabase } from '../../lib/supabase';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  subject: string;
  url: string;
  created_at: string;
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

export default function ResourcesScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    // Apply type filter
    if (typeFilter) {
      const filtered = resources.filter((resource) => resource.type === typeFilter);
      setFilteredResources(filtered);
    } else {
      setFilteredResources(resources);
    }
  }, [resources, typeFilter]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setResources(data);
        setFilteredResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // If there's an error, show mock data
      const mockData = getMockResources();
      setResources(mockData);
      setFilteredResources(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeFilter = (type: string | null) => {
    setTypeFilter(type);
    setShowFilterMenu(false);
  };

  const openResource = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Error opening URL:', err);
      alert('Could not open the resource. Please try again later.');
    });
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <View style={styles.cardWrapper}>
      <Card style={styles.resourceCard}>
        <View style={styles.cardGradient}>
          <Card.Content>
            <Title style={styles.resourceTitle}>{item.title}</Title>
            <View style={styles.resourceMeta}>
              <View style={styles.metaItem}>
                <IconButton icon="file-document" size={20} iconColor={COLORS.text} style={styles.metaIcon} />
                <Text style={styles.metaText}>Type: {item.type}</Text>
              </View>
              <View style={styles.metaItem}>
                <IconButton icon="book" size={20} iconColor={COLORS.text} style={styles.metaIcon} />
                <Text style={styles.metaText}>Subject: {item.subject}</Text>
              </View>
            </View>
            <Text style={styles.resourceDescription}>{item.description}</Text>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => openResource(item.url)}
              style={styles.viewButton}
              labelStyle={styles.viewButtonText}
            >
              View Resource
            </Button>
          </Card.Actions>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <ParticleBackground />
      
      <View style={styles.header}>
        <Text style={styles.title}>Resources</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Text style={styles.filterButtonText}>
            {typeFilter ? `Filter: ${typeFilter}` : 'Filter by Type'}
          </Text>
          <IconButton 
            icon="chevron-down" 
            size={20} 
            iconColor={COLORS.text} 
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          <TouchableOpacity
            style={styles.filterMenuItem}
            onPress={() => handleTypeFilter(null)}
          >
            <Text style={styles.filterMenuItemText}>All Types</Text>
          </TouchableOpacity>
          {RESOURCE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.filterMenuItem}
              onPress={() => handleTypeFilter(type)}
            >
              <Text style={styles.filterMenuItemText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : filteredResources.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No resources found</Text>
          <Button 
            mode="contained" 
            onPress={fetchResources}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resourcesList}
        />
      )}
    </View>
  );
}

// Mock data for when the API is unavailable
const getMockResources = (): Resource[] => [
  {
    id: '1',
    title: 'Calculus I Final Exam',
    description: 'Practice test paper for Calculus I final exam with solutions.',
    type: 'Test Paper',
    subject: 'Mathematics',
    url: 'https://example.com/calculus-exam.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Spring Semester Timetable',
    description: 'Complete timetable for all courses in the Spring semester.',
    type: 'Timetable',
    subject: 'General',
    url: 'https://example.com/spring-timetable.pdf',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Introduction to Psychology Notes',
    description: 'Comprehensive notes covering all topics in the Introduction to Psychology course.',
    type: 'Notes',
    subject: 'Psychology',
    url: 'https://example.com/psychology-notes.pdf',
    created_at: new Date().toISOString(),
  },
];

const styles = StyleSheet.create({
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
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterContainer: {
    padding: 16,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.text,
    fontSize: 16,
  },
  filterIcon: {
    margin: 0,
  },
  filterMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 8,
    elevation: 4,
  },
  filterMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterMenuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  resourcesList: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  resourceCard: {
    borderRadius: 16,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  resourceTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resourceMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaIcon: {
    margin: 0,
    marginRight: 4,
  },
  metaText: {
    color: COLORS.text,
    opacity: 0.8,
    fontSize: 16,
  },
  resourceDescription: {
    color: COLORS.text,
    opacity: 0.8,
    fontSize: 16,
    lineHeight: 24,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  viewButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.text,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
  },
}); 