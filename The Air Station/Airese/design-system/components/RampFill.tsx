import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { loudnessRamp, rampStops } from '../theme';

/**
 * Fills its parent with the loudness ramp, from the start of the scale to the colour `to` reaches:
 * the same gradient as the score rings, for bars. `up`: from the bottom (column bars); `right`: from
 * the left (track bars). Size and corners come from the parent (give it `overflow: 'hidden'`).
 */
export function RampFill({ to, direction = 'up' }: { to: number; direction?: 'up' | 'right' }) {
  const id = `ramp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const end = direction === 'up' ? { x1: '0', y1: '1', x2: '0', y2: '0' } : { x1: '0', y1: '0', x2: '1', y2: '0' };
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} {...end}>
          {rampStops(loudnessRamp, to).map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
