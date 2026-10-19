import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { CLIP_LABEL, type Clip } from '../lib/nightDetails';
import { alpha, colors, space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';

/** Data colour for a clip: breathing moments in Iris, snoring in Ember. */
export const clipColor = (clip: Clip) => (clip.type === 'Interrupted breathing' ? colors.dataBreathing : colors.dataSnoring);

const BAR_W = 2;
const BAR_GAP = 2;
const WAVE_H = 28;

/**
 * One player for a page: only one clip plays at a time; starting another stops the first.
 * Prototype: there are no audio files yet, so playback is simulated (progress runs in real time).
 * Engineering: back this with expo-audio and the clip's local file (snippet_local_file_reference).
 */
export function useClipPlayer() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const progress = useRef(new Animated.Value(0)).current; // 0 → 1 through the playing clip
  const run = useRef<Animated.CompositeAnimation | null>(null);
  const current = useRef<{ id: string; seconds: number; at: number } | null>(null);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const c = current.current;
      if (c) setElapsed(Math.floor(value * c.seconds));
    });
    return () => {
      progress.removeListener(id);
      run.current?.stop();
    };
  }, [progress]);

  const play = (clip: Clip, from = 0) => {
    run.current?.stop();
    current.current = { id: clip.id, seconds: clip.seconds, at: from };
    progress.setValue(from);
    setPlaying(clip.id);
    // Playback runs at real speed: linear by nature, not a motion choice.
    run.current = Animated.timing(progress, { toValue: 1, duration: clip.seconds * 1000 * (1 - from), easing: Easing.linear, useNativeDriver: false });
    run.current.start(({ finished }) => {
      if (!finished) return;
      setPlaying(null);
      current.current = null;
      progress.setValue(0);
      setElapsed(0);
    });
  };

  const toggle = (clip: Clip) => {
    if (playing === clip.id) {
      // Pause: remember where we were.
      run.current?.stop();
      progress.stopAnimation((v) => current.current && (current.current.at = v));
      setPlaying(null);
      return;
    }
    const resumeFrom = current.current?.id === clip.id ? current.current.at : 0;
    play(clip, resumeFrom);
  };

  /** Jump to a point (0–1) in a clip; keeps playing if it was. */
  const seek = (clip: Clip, fraction: number) => {
    const f = Math.min(0.999, Math.max(0, fraction));
    if (playing === clip.id) return play(clip, f);
    run.current?.stop();
    current.current = { id: clip.id, seconds: clip.seconds, at: f };
    progress.setValue(f);
    setElapsed(Math.floor(f * clip.seconds));
  };

  const positionOf = (clipId: string) => (current.current?.id === clipId ? progress : null);
  return { playing, elapsed, toggle, seek, positionOf };
}
export type ClipPlayerState = ReturnType<typeof useClipPlayer>;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * An audio clip (PRD §7): play / pause, time of night, length and a plain description, with a
 * small waveform that fills in Breath as it plays. While playing, the length becomes "0:07 / 0:18".
 */
export function AudioSnippet({ clip, time, player }: { clip: Clip; time: string; player: ClipPlayerState }) {
  const isPlaying = player.playing === clip.id;
  const position = player.positionOf(clip.id);
  const waveWidth = clip.peaks.length * (BAR_W + BAR_GAP) - BAR_GAP;
  const detail = position ? `${mmss(player.elapsed)} / ${mmss(clip.seconds)}` : `${clip.seconds} sec`;

  const wave = (color: string) => (
    <View style={styles.wave}>
      {clip.peaks.map((p, i) => (
        <View key={i} style={{ width: BAR_W, height: Math.max(3, p * WAVE_H), borderRadius: BAR_W / 2, backgroundColor: color }} />
      ))}
    </View>
  );

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => player.toggle(clip)}
        accessibilityRole="button"
        accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} ${time} clip, ${clip.seconds} seconds, ${clip.type.toLowerCase()}`}
        style={({ pressed }) => [styles.play, pressed && { opacity: 0.8 }]}
      >
        <Icon name={isPlaying ? 'pause_fill' : 'play_fill'} size={24} color="onAccent" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <AppText variant="button" color="text">
          {time}
        </AppText>
        <AppText variant="small" color="textMuted" numberOfLines={2} style={{ marginTop: 2 }}>
          {`${detail} · ${CLIP_LABEL[clip.type]}`}
        </AppText>
      </View>
      {/* Waveform: Mist underneath, Breath on top revealed as it plays */}
      <View style={{ width: waveWidth, height: WAVE_H }} accessible={false} importantForAccessibility="no-hide-descendants">
        {wave(alpha(colors.mist, 0.35))}
        {position ? (
          <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', width: position.interpolate({ inputRange: [0, 1], outputRange: [0, waveWidth] }) }]}>
            <View style={{ width: waveWidth }}>{wave(clipColor(clip))}</View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56 },
  play: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  wave: { flexDirection: 'row', alignItems: 'center', gap: BAR_GAP, height: WAVE_H },
});
