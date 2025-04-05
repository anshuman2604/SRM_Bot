import React from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { FontAwesome5 } from '@expo/vector-icons';
import FuturisticDots from '../../components/FuturisticDots';

const IntroScreen = () => {
  // Animation references removed to avoid errors
  
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
      
      {/* Orbital icons - using static View instead of Animated.View */}
      <View style={styles.orbitalContainer}>
        <View style={styles.orbitalRing}>
          {icons.map((icon, index) => {
            const angle = (icon.position * Math.PI) / 180;
            const radius = 130;
            const translateX = Math.cos(angle) * radius;
            const translateY = Math.sin(angle) * radius;
            
            return (
              <View
                key={index}
                style={[
                  styles.orbitalIcon,
                  {
                    backgroundColor: icon.color,
                    transform: [
                      { translateX },
                      { translateY },
                    ],
                  },
                ]}
              >
                <FontAwesome5 name={icon.name} size={24} color="#FFF" solid />
              </View>
            );
          })}
        </View>
        
        {/* Center icon */}
        <View style={styles.centerIcon}>
          <FuturisticDots 
            size={70}
            primaryColor={COLORS.primary}
            backgroundColor="transparent"
            active={true}
          />
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>College AI Assistant</Text>
        <Text style={styles.subtitle}>Your campus companion</Text>
        
        <View style={styles.features}>
          <Text style={styles.featureText}>• Campus events and activities</Text>
          <Text style={styles.featureText}>• Academic resources and schedules</Text>
          <Text style={styles.featureText}>• Campus navigation and maps</Text>
          <Text style={styles.featureText}>• Student services information</Text>
        </View>
        
        <Button 
          mode="contained" 
          onPress={navigateToLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Get Started
        </Button>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    opacity: 0.9,
  },
  orbitalContainer: {
    position: 'absolute',
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbitalIcon: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    width: '80%',
    alignItems: 'center',
    marginTop: height * 0.45,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  features: {
    marginBottom: 32,
    width: '100%',
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textAlign: 'left',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginBottom: 16,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IntroScreen;
