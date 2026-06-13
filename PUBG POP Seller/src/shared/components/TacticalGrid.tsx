import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TacticalGridProps {
  variant?: 'hex' | 'crosshatch';
}

export function TacticalGrid({ variant = 'crosshatch' }: TacticalGridProps) {
  if (variant === 'hex') {
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="hexGrid"
              width="30"
              height="26"
              patternUnits="userSpaceOnUse"
            >
              {/* Hex polygon points="15,2 26,8 26,18 15,24 4,18 4,8" mapped to SVG Path */}
              <Path
                d="M 15 2 L 26 8 L 26 18 L 15 24 L 4 18 L 4 8 Z"
                fill="none"
                stroke="rgba(212, 160, 23, 0.07)"
                strokeWidth="0.75"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#hexGrid)" />
        </Svg>
      </View>
    );
  }

  // Crosshatch grid
  const cols = Math.ceil(SCREEN_WIDTH / 26) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / 26) + 1;

  return (
    <View style={[StyleSheet.absoluteFillObject, { opacity: 0.04 }]} pointerEvents="none">
      {/* Vertical crosshatch lines */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(cols)].map((_, i) => (
          <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
      {/* Horizontal crosshatch lines */}
      <View style={{ justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(rows)].map((_, i) => (
          <View key={i} style={{ height: 1, width: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
    </View>
  );
}
