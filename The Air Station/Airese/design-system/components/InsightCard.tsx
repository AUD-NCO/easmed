import React, { useEffect, useId, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { alpha, colors, gradients, motion, radius, space, useReducedMotion, type ColorName } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { InfoButton } from './InfoButton';

/**
 * A plain-language takeaway: a short title and a sentence or two (PRD §5, §11).
 * `lead`: the night's main takeaway, set larger; otherwise a section-sized title.
 * Optional icon (e.g. the Lamp lightbulb) and an (i) for "why does it say this?" (L2 sheet).
 * Tones: `plain` (Deep), `hero` (the night's takeaway: Deep lifting into blue with a soft Breath glow),
 * `warm` (a faint Lamp wash, for "what this means"). Optional children sit underneath (e.g. the key number).
 * `visual`: a small picture between the title and the words (e.g. the week at a glance), so it reads first.
 * `mood` (hero only) colours the card by how much the night calls for attention: `calm` (blue, Breath
 * glow), `watch` (a subtle warm dusk, Lamp glow), `urgent` (wine into plum, a Flare glow inside the card
 * that slowly breathes with the attention preset; Reduce Motion: it holds still).
 */
export function InsightCard({
  title,
  body,
  lead = false,
  icon,
  onInfo,
  infoLabel,
  tone = 'plain',
  iconColor = 'lamp',
  visual,
  mood = 'calm',
  children,
}: {
  title: string;
  body?: string;
  lead?: boolean;
  icon?: IconName;
  onInfo?: () => void;
  infoLabel?: string;
  tone?: 'plain' | 'hero' | 'warm';
  /** Icon colour: Lamp by default; a status mark passes its own (e.g. Dew for a steady night). */
  iconColor?: ColorName;
  visual?: React.ReactNode;
  mood?: 'calm' | 'watch' | 'urgent';
  children?: React.ReactNode;
}) {
  return (
    <Card style={tone === 'warm' ? styles.warm : tone === 'hero' ? styles.hero : undefined}>
      {tone === 'hero' && <HeroBackground mood={mood} />}
      <View style={styles.row}>
        {icon ? (
          <View style={{ marginTop: 2 }}>
            <Icon name={icon} size={24} color={iconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <AppText variant="heading" color="text" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </AppText>
            {onInfo ? <InfoButton size={22} onPress={onInfo} label={infoLabel ?? `About ${title}`} /> : null}
          </View>
          {visual}
          {body ? (
            <AppText color={lead ? 'text' : 'textMuted'} style={{ marginTop: visual ? space.md : space.sm }}>
              {body}
            </AppText>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

// Glow strengths are capped so Moon body text stays at 7:1 or more even at the glow's brightest point
// (checked Oct 2026; the earlier 0.22 / 0.2 / 0.4 dipped to 6.8 and 6.3 at the corner).
export const MOOD = {
  calm: { stops: gradients.hero, glow: colors.accent, strength: 0.1 },
  watch: { stops: gradients.heroWatch, glow: colors.lamp, strength: 0.1 },
  urgent: { stops: gradients.heroUrgent, glow: colors.flare, strength: 0.16 },
} as const;

export function HeroBackground({ mood }: { mood: keyof typeof MOOD }) {
  const m = MOOD[mood];
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (mood !== 'urgent' || reduced) return breathe.setValue(1);
    // Urgent: the glow inside the card slowly brightens and settles, then rests.
    const { duration, rest, easing } = motion.attention;
    breathe.setValue(0.45);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: duration / 2, easing, useNativeDriver: motion.useNativeDriver }),
        Animated.timing(breathe, { toValue: 0.45, duration: duration / 2, easing, useNativeDriver: motion.useNativeDriver }),
        Animated.delay(rest),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mood, reduced, breathe]);
  return (
    <>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id={`card${id}`} x1="0" y1="0" x2="1" y2="1">
            {m.stops.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#card${id})`} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: breathe }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={`glow${id}`} cx="90%" cy="0%" r="75%">
              <Stop offset="0" stopColor={m.glow} stopOpacity={m.strength} />
              <Stop offset="1" stopColor={m.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="90%" cy="0%" r="75%" fill={`url(#glow${id})`} />
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', borderRadius: radius.xl, paddingVertical: space.xl },
  warm: { backgroundColor: colors.tintBreathing, borderWidth: 1, borderColor: alpha(colors.lamp, 0.22) },
  row: { flexDirection: 'row', gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
});
