import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TypingAnimationProps {
  dotSize?: number;
  dotColor?: string;
  dotMargin?: number;
  backgroundColor?: string;
  type?: 'dots' | 'futuristic' | 'elegant';
}

export default function TypingAnimation({
  dotSize = 8,
  dotColor = '#FFFFFF',
  dotMargin = 2,
  backgroundColor = 'transparent',
  type = 'elegant',
}: TypingAnimationProps) {
  // Animation values
  const pulse1 = React.useRef(new Animated.Value(0)).current;
  const pulse2 = React.useRef(new Animated.Value(0)).current;
  const pulse3 = React.useRef(new Animated.Value(0)).current;
  const progress = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'elegant') {
      // Pulse animations with staggered timing - only animate opacity, not scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse1, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        ])
      ).start();

      // Staggered start for second pulse
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse2, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulse2, {
              toValue: 0,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            })
          ])
        ).start();
      }, 400);

      // Staggered start for third pulse
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse3, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulse3, {
              toValue: 0,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            })
          ])
        ).start();
      }, 800);

      // Progress bar animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          })
        ])
      ).start();
    }

    return () => {
      // Clean up animations
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      pulse3.stopAnimation();
      progress.stopAnimation();
    };
  }, [type]);

  // Interpolate animation values - only for opacity, not scale
  const opacity1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const opacity3 = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (type === 'elegant') {
    return (
      <View style={styles.elegantContainer}>
        <View style={styles.pulseContainer}>
          <Animated.View 
            style={[
              styles.pulse, 
              { 
                opacity: opacity1,
                // Removed scale transform
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.pulse, 
              { 
                opacity: opacity2,
                // Removed scale transform
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.pulse, 
              { 
                opacity: opacity3,
                // Removed scale transform
              }
            ]} 
          />
        </View>
        
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={['#304FFE', '#7048E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBarBackground}
          >
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressWidth
                }
              ]}
            />
          </LinearGradient>
        </View>
      </View>
    );
  }

  // Default dots animation
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            marginHorizontal: dotMargin,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            marginHorizontal: dotMargin,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            marginHorizontal: dotMargin,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
  },
  dot: {
    backgroundColor: '#FFFFFF',
  },
  elegantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
  },
  progressBarContainer: {
    width: 100,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
