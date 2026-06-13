import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';

const TIPS = [
  {
    text: 'Upload proof of delivery within 24h of sale to protect your seller score.',
    highlights: ['proof of delivery', 'seller score'],
  },
  {
    text: 'Verified sellers get the gold badge and rank higher in search results.',
    highlights: ['Verified sellers', 'gold badge'],
  },
  {
    text: 'All transactions are protected by PUBG POP escrow payments.',
    highlights: ['PUBG POP escrow'],
  },
];

export function FieldIntelTip() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Change index
        setIndex((prev) => (prev + 1) % TIPS.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const currentTip = TIPS[index];

  const renderTextWithHighlights = (text: string, highlights: string[]) => {
    if (highlights.length === 0) {
      return <Text style={styles.body}>{text}</Text>;
    }

    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
    const escaped = sortedHighlights.map(h => h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const segments = text.split(regex);

    return (
      <Text style={styles.body}>
        {segments.map((seg, i) => {
          const isHighlight = highlights.some(h => h.toLowerCase() === seg.toLowerCase());
          return (
            <Text
              key={i}
              style={isHighlight ? styles.highlight : null}
            >
              {seg}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Left Corner Mark */}
      <View style={[styles.cornerMark, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      {/* Bottom Right Corner Mark */}
      <View style={[styles.cornerMark, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 }]} />

      <Text style={styles.tag}>FIELD INTEL</Text>
      
      <Animated.View style={{ opacity: fadeAnim }}>
        {renderTextWithHighlights(currentTip.text, currentTip.highlights)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
    borderRadius: 6,
    backgroundColor: 'rgba(212, 160, 23, 0.03)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
    marginVertical: 20,
  },
  cornerMark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: '#D4A017',
  },
  tag: {
    fontSize: 9,
    fontFamily: 'Rajdhani_700Bold',
    color: '#D4A017',
    letterSpacing: 3,
    marginBottom: 6,
  },
  body: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#8A8A9A',
    lineHeight: 18,
  },
  highlight: {
    color: '#D4A017',
    fontWeight: 'bold',
  },
});
