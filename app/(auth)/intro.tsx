import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { FontAwesome5 } from '@expo/vector-icons';

const IntroScreen = () => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const iconAnimations = Array(8).fill(0).map(() => ({
    position: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
  }));

  useEffect(() => {
    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ),
    ]).start();

    // Staggered icon animations
    iconAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim.position, {
                toValue: 1,
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.position, {
                toValue: 0,
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start();
      }, 150 * index);
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const navigateToLogin = () => {
    router.replace('/login');
  };

  // Icons for the orbital animation with type-safe names
  const icons = [
    { name: 'calendar' as const, color: '#4A8FE7', position: 0 },
    { name: 'map-marker' as const, color: '#E94E77', position: 45 },
    { name: 'users' as const, color: '#F9A26C', position: 90 },
    { name: 'book' as const, color: '#9DE0AD', position: 135 },
    { name: 'graduation-cap' as const, color: '#E84855', position: 180 },
    { name: 'globe' as const, color: '#9B5DE5', position: 225 },
    { name: 'bell' as const, color: '#F15BB5', position: 270 },
    { name: 'comments' as const, color: '#00BBF9', position: 315 },
  ];

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientBackground} />
      
      {/* Animated orbital icons */}
      <View style={styles.orbitalContainer}>
        <Animated.View
          style={[
            styles.orbitalRing,
            {
              transform: [
                { rotate },
                { scale: scaleAnim },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          {icons.map((icon, index) => {
            const angle = (icon.position * Math.PI) / 180;
            const radius = 130;
            const translateX = Math.cos(angle) * radius;
            const translateY = Math.sin(angle) * radius;
            
            const iconAnim = iconAnimations[index];
            const iconPosition = iconAnim.position.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10],
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.orbitalIcon,
                  {
                    backgroundColor: icon.color,
                    transform: [
                      { translateX },
                      { translateY },
                      { scale: iconAnim.scale },
                      { translateY: iconPosition },
                    ],
                    opacity: iconAnim.opacity,
                  },
                ]}
              >
                <FontAwesome5 name={icon.name} size={24} color="#FFF" solid />
              </Animated.View>
            );
          })}
        </Animated.View>
        
        {/* Center icon */}
        <Animated.View
          style={[
            styles.centerIcon,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.starIcon}>
            <FontAwesome5 name="star" size={32} color="#FFF" solid />
          </View>
        </Animated.View>
      </View>
      
      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.appName}>College AI</Text>
        <Text style={styles.title}>Delightful Events</Text>
        <Text style={styles.subtitle}>Start Here</Text>
        
        <Button
          mode="contained"
          onPress={navigateToLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Get Started
        </Button>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    opacity: 0.8,
  },
  orbitalContainer: {
    width: width,
    height: width,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: height * 0.2,
  },
  orbitalRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  orbitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  starIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
  },
  content: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.15,
    width: width * 0.8,
  },
  appName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 40,
  },
  button: {
    width: width * 0.8,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default IntroScreen;
