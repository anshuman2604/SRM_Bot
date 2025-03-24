import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Building3D() {
  const rotateXAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const elevateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // X-axis rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateXAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateXAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Y-axis rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateYAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateYAnim, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation for windows
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(elevateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(elevateAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spinX = rotateXAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const spinY = rotateYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0.9],
  });

  const elevation = elevateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const scale = elevateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buildingContainer,
          {
            transform: [
              { perspective: 1200 },
              { scale },
              { rotateX: spinX },
              { rotateY: spinY },
              { translateY: elevation },
            ],
          },
        ]}
      >
        {/* Main Building Structure */}
        <View style={styles.mainBuilding}>
          {/* Horizontal floor dividers */}
          {Array.from({ length: 5 }).map((_, i) => (
            <View 
              key={`floor-${i}`} 
              style={[
                styles.floorDivider,
                { top: (i + 1) * 60 }
              ]} 
            />
          ))}

          {/* SRM Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/srm-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Windows */}
          {Array.from({ length: 5 }).map((_, row) => (
            Array.from({ length: 8 }).map((_, col) => {
              // Skip center windows on top floors for logo placement
              if (row < 3 && col > 2 && col < 5) return null;
              
              return (
                <Animated.View
                  key={`window-${row}-${col}`}
                  style={[
                    styles.window,
                    {
                      top: 10 + row * 60, 
                      left: 10 + col * 25,
                      height: row === 4 ? 40 : 45, // Bottom floor windows are shorter
                      borderTopLeftRadius: row === 4 ? 10 : 0,
                      borderTopRightRadius: row === 4 ? 10 : 0,
                      opacity: glowOpacity,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#64B5F6', '#42A5F5', '#1E88E5']}
                    style={styles.windowGradient}
                  />
                </Animated.View>
              );
            })
          ))}

          {/* Building details */}
          <View style={styles.buildingCorner1} />
          <View style={styles.buildingCorner2} />
          <View style={styles.buildingCorner3} />
          <View style={styles.buildingCorner4} />
        </View>

        {/* Building Base */}
        <LinearGradient
          colors={['#E0E0E0', '#BDBDBD', '#9E9E9E']}
          style={styles.base}
        />

        {/* Ground Reflection */}
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'transparent']}
          style={styles.reflection}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingContainer: {
    width: 220,
    height: 350,
    alignItems: 'center',
  },
  mainBuilding: {
    width: '100%',
    height: 300,
    backgroundColor: '#FFF5F5',
    borderRadius: 4,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  floorDivider: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#F0E0E0',
  },
  window: {
    position: 'absolute',
    width: 20,
    height: 45,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  windowGradient: {
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  buildingCorner1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 10,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  buildingCorner2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  buildingCorner3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  buildingCorner4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  base: {
    width: '105%',
    height: 15,
    borderRadius: 4,
    marginTop: -7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reflection: {
    width: '150%',
    height: 40,
    marginTop: 10,
    opacity: 0.5,
  },
});
