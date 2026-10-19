import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { CLIP_LABEL, type Clip, type ClipMark } from '../lib/nightDetails';
import { alpha, colors, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { clipColor, type ClipPlayerState as Player } from './AudioSnippet';
import { Icon } from '@ds/components/Icon';

const BARS = 44;
const WAVE_H = 64;
const KNOB = 18;

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** A fuller waveform from a clip's peaks: same shape, more bars, a soft envelope. */
function shape(peaks: number[]) {
  return Array.from({ length: BARS }, (_, i) => {
    const p = peaks[Math.floor((i / BARS) * peaks.length)];
    const wave = 0.75 + 0.25 * Math.sin(i * 1.7);
    return Math.max(0.12, Math.min(1, p * wave));
  });
}

const MARK_LABEL: Record<ClipMark['kind'], string> = { pause: 'Pause', breath: 'Loud breath' };

/**
 * The large clip player (after the reference): time and description, a big waveform in the
 * clip's data colour that fills as it plays, a scrubber with a knob (tap or drag along it to
 * jump), elapsed and total time, and a round play / pause button.
 * Marked stretches (a breathing clip's pause and the louder breath after it) are framed on the
 * waveform and named above it: the pause in a dashed Iris frame, the breath in a solid Ember one.
 * `detail` replaces the line under the time (e.g. the level in dB).
 */
export function ClipPlayer({ clip, time, player, detail }: { clip: Clip; time: string; player: Player; detail?: string }) {
  const [width, setWidth] = useState(0);
  const playing = player.playing === clip.id;
  const position = player.positionOf(clip.id);
  const color = clipColor(clip);
  const bars = shape(clip.peaks);
  const fill = position ? position.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) : 0;

  const seekAt = (e: GestureResponderEvent) => width > 0 && player.seek(clip, e.nativeEvent.locationX / width);

  const wave = (opacity: number) => (
    <View style={styles.wave}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, height: b * WAVE_H, borderRadius: 2, backgroundColor: color, opacity }} />
      ))}
    </View>
  );

  return (
    <View>
      <AppText variant="heading" color="text">
        {time}
      </AppText>
      <AppText variant="small" color="textMuted" style={{ marginTop: 2 }}>
        {detail ?? `${clip.seconds} sec · ${CLIP_LABEL[clip.type]}`}
      </AppText>

      {/* Names for the marked stretches */}
      {clip.marks && width > 0 ? (
        <View style={styles.markLabels} accessible={false}>
          {clip.marks.map((m) => (
            <AppText key={m.kind} variant="small" color="text" numberOfLines={1} style={[styles.markLabel, { left: m.from * width, width: Math.max(96, (m.to - m.from) * width) }]}>
              {MARK_LABEL[m.kind]}
            </AppText>
          ))}
        </View>
      ) : null}

      {/* Waveform: dim underneath, full colour revealed as it plays */}
      <Pressable onPress={seekAt} accessibilityRole="adjustable" accessibilityLabel={`${time} clip, ${clip.seconds} seconds${clip.marks ? `: ${clip.marks.map((m) => `${MARK_LABEL[m.kind].toLowerCase()} at ${Math.round(m.from * clip.seconds)} seconds`).join(', ')}` : ''}`} style={{ marginTop: clip.marks ? space.sm : space.xl }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {wave(0.3)}
        {position ? <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', width: fill }]}><View style={{ width }}>{wave(1)}</View></Animated.View> : null}
        {clip.marks?.map((m) => <View key={m.kind} pointerEvents="none" style={[styles.mark, m.kind === 'pause' ? styles.markPause : styles.markBreath, { left: m.from * width - 3, width: (m.to - m.from) * width + 6 }]} />)}
      </Pressable>

      {/* Scrubber */}
      <Pressable onPress={seekAt} hitSlop={{ top: 14, bottom: 14 }} style={styles.scrub} accessible={false}>
        <View style={styles.track} />
        <Animated.View style={[styles.done, { width: fill, backgroundColor: color }]} />
        <Animated.View style={[styles.knob, { transform: [{ translateX: position ? Animated.subtract(fill, KNOB / 2) : -KNOB / 2 }] }]} />
      </Pressable>
      <View style={styles.times}>
        <AppText variant="small" color="textMuted">
          {mmss(position ? player.elapsed : 0)}
        </AppText>
        <AppText variant="small" color="textMuted">
          {mmss(clip.seconds)}
        </AppText>
      </View>

      <Pressable
        onPress={() => player.toggle(clip)}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : `Play ${time} clip`}
        style={({ pressed }) => [styles.play, pressed && { opacity: 0.85 }]}
      >
        <Icon name={playing ? 'pause_fill' : 'play_fill'} size={30} color="onAccent" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  markLabels: { height: 20, marginTop: space.xl },
  markLabel: { position: 'absolute', top: 0 },
  mark: { position: 'absolute', top: -6, bottom: -6, borderRadius: 8, borderWidth: 1.5 },
  markPause: { borderColor: colors.dataBreathing, borderStyle: 'dashed', backgroundColor: alpha(colors.iris, 0.10) },
  markBreath: { borderColor: colors.dataSnoring, backgroundColor: alpha(colors.ember, 0.08) },
  wave: { height: WAVE_H, flexDirection: 'row', alignItems: 'center', gap: 3 },
  scrub: { height: KNOB + 8, justifyContent: 'center', marginTop: space.lg },
  track: { height: 4, borderRadius: 2, backgroundColor: alpha(colors.moon, 0.15) },
  done: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  knob: { position: 'absolute', left: 0, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  play: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, marginTop: space.md },
});
