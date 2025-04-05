import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/Config';

interface FuturisticDotsProps {
  size?: number;
  primaryColor?: string;
  backgroundColor?: string;
  active?: boolean;
}

const FuturisticDots = ({
  size = 80,
  primaryColor = COLORS.primary,
  backgroundColor = 'transparent',
  active = true,
}: FuturisticDotsProps) => {
  // Use fewer dots for better performance
  const dotCount = 6;
  
  // Render the dots
  const renderDots = () => {
    return Array(dotCount).fill(0).map((_, index) => {
      // Calculate position on circle
      const angle = (index / dotCount) * 2 * Math.PI;
      const radius = size / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Alternate colors
      const dotColor = index % 2 === 0 
        ? primaryColor 
        : '#00BFFF';
      
      return (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: size / 10,
              height: size / 10,
              backgroundColor: dotColor,
              transform: [
                { translateX: x },
                { translateY: y },
              ],
              opacity: 0.7,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      {/* Static dots container */}
      <View
        style={[
          styles.dotsContainer,
          {
            width: size,
            height: size,
          },
        ]}
      >
        {renderDots()}
      </View>
      
      {/* Core */}
      <View
        style={[
          styles.core,
          {
            width: size / 3,
            height: size / 3,
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
    overflow: 'hidden',
  },
  dotsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  core: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default FuturisticDots;
