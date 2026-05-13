// src/components/GradientBackground.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// Simulation du gradient rose → lavande avec des couches superposées
// (remplace par LinearGradient si tu as react-native-linear-gradient installé)
const GradientBackground = ({ children, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.layer1} />
    <View style={styles.layer2} />
    <View style={styles.layer3} />
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8E0FF',   // ← mauve clair
  },
  layer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DDD5FF',   // ← mauve doux
    opacity: 0.8,
  },
  layer2: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: '#C9BFEF',   // ← lavande plus foncé
    opacity: 0.5,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 200,
  },
  layer3: {
    position: 'absolute',
    top: '25%',
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#B8A8E8',   // ← accent violet
    opacity: 0.25,
  },
  content: { flex: 1 },
});

export default GradientBackground;