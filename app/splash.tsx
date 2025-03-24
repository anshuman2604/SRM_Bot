import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../constants/Config';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mainFadeAnim = useRef(new Animated.Value(1)).current; // Controls the overall fade
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoTextAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const brainScaleAnim = useRef(new Animated.Value(0)).current;
  const brainRotateAnim = useRef(new Animated.Value(0)).current;
  const circuitAnim = useRef(new Animated.Value(0)).current;
  const letterAnims = Array(7).fill(0).map(() => useRef(new Animated.Value(30)).current);
  
  // Animation values for flying objects
  const flyingObjects = [
    { icon: 'book', color: '#4A8FE7', size: 24, startPosition: { x: -200, y: 200 }, endPosition: { x: 0, y: 0 } },
    { icon: 'pencil-alt', color: '#E94E77', size: 20, startPosition: { x: 200, y: -200 }, endPosition: { x: 0, y: 0 } },
    { icon: 'atom', color: '#9B5DE5', size: 26, startPosition: { x: -180, y: -180 }, endPosition: { x: 0, y: 0 } },
    { icon: 'laptop-code', color: '#F15BB5', size: 22, startPosition: { x: 180, y: 180 }, endPosition: { x: 0, y: 0 } },
    { icon: 'microchip', color: '#00F5D4', size: 20, startPosition: { x: 160, y: -160 }, endPosition: { x: 0, y: 0 } },
    { icon: 'graduation-cap', color: '#9DE0AD', size: 24, startPosition: { x: -170, y: -170 }, endPosition: { x: 0, y: 0 } },
  ].map(obj => ({
    ...obj,
    opacity: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(obj.startPosition.x)).current,
    translateY: useRef(new Animated.Value(obj.startPosition.y)).current,
    rotate: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0.5)).current,
    visible: useRef(new Animated.Value(1)).current, // New value to control visibility
  }));
  
  // Particle animations - reduced number
  const particleAnims = Array(25).fill(0).map(() => ({
    position: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
  }));

  // Circuit lines animations - reduced number
  const circuitLines = Array(6).fill(0).map((_, i) => ({
    progress: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    angle: i * 60, // Spread evenly in a circle
    length: 100 + Math.random() * 80,
  }));

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Fade in and scale up the logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Pause for a moment
      Animated.delay(300),
      
      // Animate the glow effect, brain and circuits
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.spring(brainScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(brainRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(circuitAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      
      // Animate the text
      Animated.timing(logoTextAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      
      // Hold the animation for a moment
      Animated.delay(2000),
    ]).start(() => {
      // Fade out everything together
      Animated.timing(mainFadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start(() => {
        // Call the onComplete callback to notify parent component
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 100);
        }
      });
    });

    // Animate each letter with staggered timing
    letterAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }, 1200 + index * 80);
    });

    // Animate circuit lines
    circuitLines.forEach((line, index) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(line.opacity, {
            toValue: 0.7,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(line.progress, {
            toValue: 1,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start();
      }, 800 + index * 150);
    });

    // Animate flying objects with more staggered timing
    flyingObjects.forEach((obj, index) => {
      setTimeout(() => {
        // Calculate distance to center for timing
        const distance = Math.sqrt(
          Math.pow(obj.startPosition.x, 2) + 
          Math.pow(obj.startPosition.y, 2)
        );
        
        // Calculate when object should be 60% of the way to center
        const fadeOutPoint = distance * 0.6;
        const timeToFadeOut = 1500 * (fadeOutPoint / distance);
        
        // First animation sequence - fly to center
        Animated.sequence([
          // Initial appearance and movement
          Animated.parallel([
            // Fade in
            Animated.timing(obj.opacity, {
              toValue: 0.85,
              duration: 400,
              useNativeDriver: true,
            }),
            // Scale up
            Animated.spring(obj.scale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            // Move to center
            Animated.timing(obj.translateX, {
              toValue: obj.endPosition.x,
              duration: 1500,
              useNativeDriver: true,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
            Animated.timing(obj.translateY, {
              toValue: obj.endPosition.y,
              duration: 1500,
              useNativeDriver: true,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
            // Rotate continuously
            Animated.loop(
              Animated.timing(obj.rotate, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
                easing: Easing.linear,
              })
            ),
          ]),
        ]).start();
        
        // Separate animation for fading out
        setTimeout(() => {
          Animated.timing(obj.visible, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }).start();
        }, timeToFadeOut);
        
      }, 800 + index * 200);
    });

    // Particle animations
    particleAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.sequence([
          // Wait for the logo to appear
          Animated.delay(800 + Math.random() * 300),
          
          // Animate particles
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0.6,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.position, {
              toValue: 1,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]),
          
          // Fade out particles
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 70);
    });
  }, []);

  // Glow effect interpolation
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 0],
  });

  const glowSize = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 220],
  });

  // Brain rotation interpolation
  const brainRotation = brainRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: mainFadeAnim }]}>
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#0A0A0A', '#141414']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Circuit lines */}
      {circuitLines.map((line, index) => {
        const angle = (line.angle * Math.PI) / 180;
        const startX = Math.cos(angle) * 70;
        const startY = Math.sin(angle) * 70;
        const endX = Math.cos(angle) * line.length;
        const endY = Math.sin(angle) * line.length;
        
        const x = line.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [startX, endX],
        });
        
        const y = line.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [startY, endY],
        });
        
        return (
          <Animated.View
            key={`circuit-${index}`}
            style={[
              styles.circuitLine,
              {
                opacity: line.opacity,
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { rotate: `${line.angle}deg` },
                ],
                backgroundColor: index % 3 === 0 ? COLORS.primary : 
                                index % 3 === 1 ? '#00F5D4' : 
                                '#9B5DE5',
              },
            ]}
          />
        );
      })}
      
      {/* Particles */}
      {particleAnims.map((anim, index) => {
        // Random positions and sizes for particles
        const size = 2 + Math.random() * 5;
        const startX = Math.random() * 300 - 150;
        const startY = Math.random() * 300 - 150;
        const endX = startX * (2 + Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);
        const endY = startY * (2 + Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);
        
        const translateX = anim.position.interpolate({
          inputRange: [0, 1],
          outputRange: [startX, endX],
        });
        
        const translateY = anim.position.interpolate({
          inputRange: [0, 1],
          outputRange: [startY, endY],
        });
        
        // Determine if particle should be a square or circle
        const isSquare = index % 7 === 0;
        
        return (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                width: size,
                height: size,
                borderRadius: isSquare ? 1 : size / 2,
                backgroundColor: index % 5 === 0 ? COLORS.primary : 
                               index % 5 === 1 ? '#FFFFFF' : 
                               index % 5 === 2 ? '#00F5D4' :
                               index % 5 === 3 ? '#F9A26C' : '#9B5DE5',
                opacity: anim.opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { scale: anim.scale },
                  { rotate: isSquare ? '45deg' : '0deg' },
                ],
              },
            ]}
          />
        );
      })}
      
      {/* Brain structure */}
      <Animated.View
        style={[
          styles.brainContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: brainScaleAnim },
              { rotate: brainRotation },
            ],
          },
        ]}
      >
        <View style={styles.brainOuter}>
          <FontAwesome5 name="brain" size={100} color="rgba(155, 93, 229, 0.1)" />
        </View>
      </Animated.View>

      {/* Flying objects layer */}
      <View style={styles.flyingObjectsContainer}>
        {flyingObjects.map((obj, index) => {
          const rotation = obj.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });
          
          return (
            <Animated.View
              key={`flying-${index}`}
              style={[
                styles.flyingObject,
                {
                  backgroundColor: obj.color,
                  opacity: Animated.multiply(obj.opacity, obj.visible),
                  transform: [
                    { translateX: obj.translateX },
                    { translateY: obj.translateY },
                    { rotate: rotation },
                    { scale: obj.scale },
                  ],
                },
              ]}
            >
              <FontAwesome5 name={obj.icon} size={obj.size} color="#FFFFFF" solid />
            </Animated.View>
          );
        })}
      </View>

      {/* Logo Container */}
      <View style={styles.logoWrapper}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, '#7B4AFF', '#4A00E0']}
            style={styles.logoIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="robot" size={60} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        
        {/* Logo Text */}
        <Animated.View
          style={[
            styles.logoTextContainer,
            {
              opacity: logoTextAnim,
            },
          ]}
        >
          {['S', 'R', 'M', ' ', 'B', 'O', 'T'].map((letter, index) => (
            <Animated.Text
              key={`letter-${index}`}
              style={[
                styles.logoText,
                {
                  transform: [
                    { translateY: letterAnims[index] },
                  ],
                },
                letter === ' ' ? { width: 12 } : {},
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </Animated.View>
        
        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: logoTextAnim,
              transform: [
                { translateY: Animated.multiply(logoTextAnim, -10) },
              ],
            },
          ]}
        >
          <Text style={styles.tagline}>Your AI Study Companion</Text>
        </Animated.View>
      </View>
      
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize,
          },
        ]}
      />
      
      {/* Futuristic scan line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 0],
            }),
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 100],
                }),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50, // Much higher z-index
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    backgroundColor: 'rgba(0,0,0,1)', // Fully opaque black background
  },
  logoTextContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  taglineContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary || '#AAAAAA',
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    zIndex: 2,
  },
  flyingObjectsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  flyingObject: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -23,
    marginTop: -23,
  },
  brainContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -10, // Make sure it's behind everything
  },
  brainOuter: {
    width: 300,
    height: 300,
    borderRadius: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circuitLine: {
    position: 'absolute',
    height: 2,
    width: 40,
    zIndex: 0,
  },
  scanLine: {
    position: 'absolute',
    height: 2,
    width: width * 0.8,
    backgroundColor: '#00F5D4',
    zIndex: 30,
  },
});

export default SplashScreen;
