import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Card, Title, Text, IconButton, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS, ROUTES } from '../../constants/Config';
import { getUserInfo } from '../../services/storage';
import { UserProfile } from '../../services/auth';
import { useAdminStatus } from '../../hooks/useAdminStatus';

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

// Feature card component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

const FeatureCard = ({ title, description, icon, onPress }: FeatureCardProps) => (
  <View style={styles.cardWrapper}>
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardGradient}>
        <View style={styles.cardContent}>
          <IconButton
            icon={icon}
            size={32}
            iconColor={COLORS.text}
            style={styles.cardIcon}
          />
          <Title style={styles.cardTitle}>{title}</Title>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
    </Card>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isAdminUser, isLoading } = useAdminStatus();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await getUserInfo();
      setUserProfile(user);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Base features available to all users
  const baseFeatures = [
    {
      title: 'Chat with AI',
      description: 'Ask questions and get instant answers about campus life',
      icon: 'chat',
      route: ROUTES.CHAT,
    },
    {
      title: 'Campus Events',
      description: 'Discover and RSVP to upcoming events on campus',
      icon: 'calendar',
      route: ROUTES.EVENTS,
    },
    {
      title: 'Resources',
      description: 'Access study materials, timetables, and notes',
      icon: 'book',
      route: ROUTES.RESOURCES,
    },
  ];

  // Admin feature only shown to admin users
  const adminFeature = {
    title: 'Admin Panel',
    description: 'Manage content and settings',
    icon: 'shield-account',
    route: ROUTES.ADMIN_DASHBOARD, // Direct to dashboard instead of login
  };
  
  // Combine features based on admin status
  const features = isAdminUser 
    ? [...baseFeatures, adminFeature] 
    : baseFeatures;

  return (
    <View style={styles.container}>
      <ParticleBackground />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {userProfile?.full_name ? `Hello, ${userProfile.full_name.split(' ')[0]}!` : 'Welcome!'}
            </Text>
            <Text style={styles.title}>College AI Assistant</Text>
            <Text style={styles.subtitle}>Your campus companion</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
            <Avatar.Icon 
              size={50} 
              icon="account" 
              color={COLORS.text} 
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => router.push(feature.route)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

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
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  profileButton: {
    marginLeft: 16,
  },
  avatar: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  cardGradient: {
    padding: 24,
    backgroundColor: COLORS.primary,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    margin: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
  },
  cardDescription: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
}); 