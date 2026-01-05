import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 80,
        friction: 4,
      }),
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 7,
      }),
    ]).start();

    const loopDots = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    );

    loopDots.start();
    return () => loopDots.stop();
  }, [opacity, scale, translateY, dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>FoodExpress</Text>
        <Text style={styles.subtitle}>Catering Online Terpercaya</Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <Animated.Text style={[styles.dot, { opacity: dot1 }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot2 }]}>•</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dot3 }]}>•</Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 88,
    marginBottom: 14,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  dot: {
    fontSize: 22,
    color: '#fff',
    marginHorizontal: 4,
  },
});
