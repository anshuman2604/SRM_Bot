import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../constants/Config';

interface FuturisticPulseProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  active?: boolean;
}

const FuturisticPulse: React.FC<FuturisticPulseProps> = ({
  size = 100,
  primaryColor = COLORS.primary,
  secondaryColor = '#1a1a1a',
  active = true,
}) => {
  // Animation values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Calculate sizes based on the main size prop
  const dotSize = size * 0.08;
  const ringSize = size * 0.8;
  const outerRingSize = size;

  useEffect(() => {
    // Pulse animations
    const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1500,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Rotation animation
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Start or stop animations based on active prop
    if (active) {
      createPulseAnimation(pulseAnim1, 0).start();
      createPulseAnimation(pulseAnim2, 500).start();
      createPulseAnimation(pulseAnim3, 1000).start();
      rotationAnimation.start();
    } else {
      // Reset and stop animations
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      pulseAnim3.setValue(0);
      rotateAnim.setValue(0);
    }

    // Clean up animations on unmount
    return () => {
      pulseAnim1.stopAnimation();
      pulseAnim2.stopAnimation();
      pulseAnim3.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [active, pulseAnim1, pulseAnim2, pulseAnim3, rotateAnim]);

  // Interpolate opacity for pulse effects
  const opacity1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0.2],
  });

  const opacity2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.1],
  });

  const opacity3 = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  // Interpolate rotation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Generate dots in a circle
  const renderDots = () => {
    const dots = [];
    const numDots = 12;
    const radius = ringSize / 2;

    for (let i = 0; i < numDots; i++) {
      const angle = (i * 2 * Math.PI) / numDots;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Alternate dot colors
      const dotColor = i % 2 === 0 ? primaryColor : secondaryColor;
      
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: dotColor,
              left: x + radius - dotSize / 2,
              top: y + radius - dotSize / 2,
            },
          ]}
        />
      );
    }

    return dots;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer pulsing rings */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: outerRingSize,
            height: outerRingSize,
            borderRadius: outerRingSize / 2,
            borderColor: primaryColor,
            opacity: opacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: ringSize * 1.1,
            height: ringSize * 1.1,
            borderRadius: (ringSize * 1.1) / 2,
            borderColor: primaryColor,
            opacity: opacity2,
          },
        ]}
      />
      
      {/* Rotating dot circle */}
      <Animated.View
        style={[
          styles.dotContainer,
          {
            width: ringSize,
            height: ringSize,
            transform: [{ rotate }],
          },
        ]}
      >
        {renderDots()}
      </Animated.View>
      
      {/* Center dot */}
      <View
        style={[
          styles.centerDot,
          {
            width: dotSize * 2,
            height: dotSize * 2,
            backgroundColor: primaryColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotContainer: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    borderRadius: 50,
  },
  centerDot: {
    borderRadius: 50,
    zIndex: 10,
  },
});

export default FuturisticPulse;
