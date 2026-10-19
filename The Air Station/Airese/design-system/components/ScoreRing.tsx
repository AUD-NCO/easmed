import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { alpha, colors, motion, rampColor, useReducedMotion } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * A ring showing how far along its scale a score sits, with the data's icon (or the score) in the middle.
 * `ramp`: colours spread around the whole scale (start to full), so the arc runs through them and ends
 * in the colour its score has reached (the loudness ramp: a low score stays cyan, only near-full reaches red).
 * Fills in once on arrival (slow ease-out); Reduce Motion shows it filled.
 */
export function ScoreRing({
  fraction,
  color,
  ramp,
  icon,
  size = 64,
  stroke = 6,
  children,
}: {
  fraction: number;
  color: string;
  ramp?: readonly string[];
  icon?: IconName;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0.04, Math.min(1, fraction));
  // Progress drives a plain SVG circle (animated SVG elements leak native-only props on web).
  const t = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [p, setP] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return setP(1);
    const id = t.addListener(({ value }) => setP(value));
    Animated.timing(t, { toValue: 1, duration: motion.slow.duration, delay: motion.stagger, easing: motion.slow.easeOut, useNativeDriver: false }).start();
    return () => t.removeListener(id);
  }, [reduced, t]);

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(colors.moon, 0.1)} strokeWidth={stroke} fill="none" />
        {ramp ? (
          <RampArc size={size} r={r} stroke={stroke} to={f * p} ramp={ramp} />
        ) : (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c - c * f * p}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children ?? (icon ? <Icon name={icon} size={22} color="text" /> : null)}
      </View>
    </View>
  );
}
/**
 * The arc as short steps (SVG has no sweep gradient), each in the ramp's colour at that point of the
 * scale, with round caps at both ends in their own colours. `to`: how much of the circle, 0 to 1.
 */
function RampArc({ size, r, stroke, to, ramp }: { size: number; r: number; stroke: number; to: number; ramp: readonly string[] }) {
  if (to <= 0) return null;
  const at = (t: number): [number, number] => [size / 2 + r * Math.cos(t * 2 * Math.PI), size / 2 + r * Math.sin(t * 2 * Math.PI)];
  const n = Math.max(1, Math.ceil(to * 90));
  const steps = Array.from({ length: n }, (_, i) => {
    const a = (to * i) / n;
    const b = Math.min(to, (to * (i + 1)) / n + 0.002); // a hair of overlap, so no seams
    const [x0, y0] = at(a);
    const [x1, y1] = at(b);
    return <Path key={i} d={`M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`} stroke={rampColor(ramp, (a + b) / 2)} strokeWidth={stroke} fill="none" />;
  });
  const [sx, sy] = at(0);
  const [ex, ey] = at(to);
  return (
    <>
      <Circle cx={sx} cy={sy} r={stroke / 2} fill={ramp[0]} />
      {steps}
      <Circle cx={ex} cy={ey} r={stroke / 2} fill={rampColor(ramp, to)} />
    </>
  );
}
