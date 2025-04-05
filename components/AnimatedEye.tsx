import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Config';

interface AnimatedEyeProps {
  size?: number;
  primaryColor?: string;
  backgroundColor?: string;
  isClosed?: boolean;
}

const AnimatedEye = ({
  size = 80,
  primaryColor = COLORS.primary,
  backgroundColor = '#000',
  isClosed = false,
}: AnimatedEyeProps) => {
  // Static eye component without animations
  return (
    <View style={[styles.container, { width: size * 1.8, height: size }]}>
      {/* Main eye container */}
      <View 
        style={[
          styles.eyeContainer,
          {
            width: size * 1.8,
            height: size * 0.8,
            transform: [{ scaleY: isClosed ? 0.1 : 1 }]
          }
        ]}
      >
        {/* Almond eye shape outline with glow - using LinearGradient for the glow effect */}
        <LinearGradient
          colors={['#8A2BE2', '#00FFFF']} // Purple to cyan gradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.eyeOutline,
            {
              width: size * 1.8,
              height: size * 0.8,
              borderRadius: size * 0.4,
              opacity: 0.8,
            }
          ]}
        />
        
        {/* Eye interior */}
        <View
          style={[
            styles.eyeInterior,
            {
              width: size * 1.5,
              height: size * 0.6,
              borderRadius: size * 0.3
            }
          ]}
        >
          {/* Iris with gradient */}
          <LinearGradient
            colors={['#4B0082', '#000033']} // Indigo to dark blue
            style={[
              styles.iris,
              {
                width: size * 0.65,
                height: size * 0.65,
                borderRadius: size * 0.325
              }
            ]}
          >
            {/* Pupil */}
            <View
              style={[
                styles.pupil,
                {
                  width: size * 0.35,
                  height: size * 0.35,
                  borderRadius: size * 0.175,
                }
              ]}
            >
              {/* Main light reflection */}
              <View
                style={[
                  styles.reflection,
                  {
                    width: size * 0.12,
                    height: size * 0.12,
                    borderRadius: size * 0.06,
                    top: '15%',
                    right: '15%'
                  }
                ]}
              />
              
              {/* Secondary light reflection */}
              <View
                style={[
                  styles.smallReflection,
                  {
                    width: size * 0.06,
                    height: size * 0.06,
                    borderRadius: size * 0.03,
                    bottom: '25%',
                    left: '25%'
                  }
                ]}
              />
            </View>
          </LinearGradient>
        </View>
        
        {/* Eyelashes - top right */}
        <View
          style={[
            styles.eyelash,
            {
              width: size * 0.25,
              height: 2,
              top: size * 0.05,
              right: size * 0.25,
              transform: [{ rotate: '-35deg' }]
            }
          ]}
        />
        
        {/* Eyelashes - top right 2 */}
        <View
          style={[
            styles.eyelash,
            {
              width: size * 0.2,
              height: 2,
              top: size * 0.1,
              right: size * 0.35,
              transform: [{ rotate: '-25deg' }]
            }
          ]}
        />
        
        {/* Eyelashes - top left */}
        <View
          style={[
            styles.eyelash,
            {
              width: size * 0.25,
              height: 2,
              top: size * 0.05,
              left: size * 0.25,
              transform: [{ rotate: '35deg' }]
            }
          ]}
        />
        
        {/* Eyelashes - top left 2 */}
        <View
          style={[
            styles.eyelash,
            {
              width: size * 0.2,
              height: 2,
              top: size * 0.1,
              left: size * 0.35,
              transform: [{ rotate: '25deg' }]
            }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  eyeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  eyeOutline: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  eyeInterior: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iris: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  pupil: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  reflection: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  smallReflection: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  eyelash: {
    position: 'absolute',
    backgroundColor: '#8A2BE2',
    borderRadius: 1,
  },
});

export default AnimatedEye;
