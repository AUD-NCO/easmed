import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { colors } from '@ds/theme';
import type { Clip } from './nightDetails';

/** Data colour for a clip: breathing moments in Iris, snoring in Ember. */
export const clipColor = (clip: Clip) => (clip.type === 'Interrupted breathing' ? colors.dataBreathing : colors.dataSnoring);

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
