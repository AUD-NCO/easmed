import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AmbientGradient, AppText, Avatar, Button, Icon, PAGE_SIDE, PAGE_TITLE_TOP, PageTitle, PermissionSheet, RecordDial, TAB_BAR_CLEARANCE, type DialRect } from '../components';
import { initials, useProfile } from '../lib/profile';
import { refreshPermissions, usePermissionStatus, type PermissionKind } from '../lib/permissionStatus';
import { checkCanRecord, demoLastNightStopped, demoStop, stopTime, type StartProblem } from '../lib/recordingIssues';
import { useNights } from '../lib/recordings';
import { homeMessage, type HomeMessage } from '../lib/tips';
import { alpha, colors, motion, radius, space, useInsets } from '@ds/theme';

const native = motion.useNativeDriver;
const PANEL_RADIUS = 32;
const DIAL_MAX = 180; // present, not loud
const DIAL_LABEL = 84; // room under the dial for "Tap to start recording" and the privacy line

/**
 * Home: tap the dial to start. Recording runs until you stop it when you wake (no stop time to
 * choose at bedtime; it stops by itself after 8 hours as a safety net).
 *
 * Layers, back to front:
 *   1. A night-to-blue gradient with a slow, faint drift of light (ambient preset), so the screen feels alive.
 *   2. The banner (Breath): one message at a time, the most useful for right now, with its action
 *      under the text (lib/tips: microphone → notifications → charging). Keep it charging is the
 *      message once nothing more urgent is left, with no action.
 *   3. The panel (Midnight) with the record dial.
 */
/** Where the record button sits, in Home's own coordinates, so Recording can grow out of it. */
export type RecordOrigin = { x: number; y: number; r: number };

export function HomeScreen({
  onStartRecording,
  onOpenProfile,
  onOpenLastNight,
  onCantStart,
}: {
  onStartRecording?: (from: RecordOrigin) => void;
  onOpenProfile?: () => void;
  /** Last night stopped early: "See what was saved" opens its report. */
  onOpenLastNight?: (state: string) => void;
  /** Recording can't start (no space, or the recorder failed): opens the problem screen. */
  onCantStart?: (problem: StartProblem) => void;
}) {
  const rootRef = useRef<View>(null);
  const insets = useInsets();
  const profile = useProfile();
  const [width, setWidth] = useState(0);
  const mic = usePermissionStatus('microphone');
  const notifications = usePermissionStatus('notifications');
  const micOff = mic !== 'granted';
  // Prototype: the demo nav's stopped night. Engineering: the latest night's own stop, until its report is opened.
  const latest = useNights()[0];
  const [stoppedState] = useState(demoLastNightStopped);
  const stop = demoStop(stoppedState ?? undefined);
  const message = homeMessage({
    micOn: !micOff,
    notificationsOn: notifications === 'granted',
    stoppedAt: stop && latest ? stopTime(latest, stop) : undefined,
  });
  const onMessageAction = () => {
    if (message.id === 'stopped') return stoppedState && onOpenLastNight?.(stoppedState);
    if (message.id === 'microphone' || message.id === 'notifications') return ask(message.id);
  };

  // Asking again in context (tip "Turn on", or the dial while the mic is off).
  const [permSheet, setPermSheet] = useState<PermissionKind | null>(null);
  const [permKind, setPermKind] = useState<PermissionKind>('microphone'); // stays put while the sheet closes
  const pendingStart = useRef<DialRect | null>(null); // the hold that asked for the mic: start once allowed
  const ask = (kind: PermissionKind) => {
    setPermKind(kind);
    setPermSheet(kind);
  };

  // On device: read permissions on open and whenever the app comes back (e.g. from Settings).
  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refreshPermissions());
    return () => sub.remove();
  }, []);

  const [stageTop, setStageTop] = useState(0);

  const [dialRoom, setDialRoom] = useState({ width: 0, height: 0 });
  const dialSize = Math.floor(Math.min(DIAL_MAX, dialRoom.width, dialRoom.height - DIAL_LABEL));

  // Tapped: hand over where the button is (window → Home coordinates, allowing for the preview's
  // scaled phone frame). Recording runs until you stop it in the morning (8-hour safety cap).
  const startRecording = (dial: DialRect, micJustAllowed = false) => {
    if (micOff && !micJustAllowed) {
      pendingStart.current = dial;
      return ask('microphone');
    }
    // Can't start (no space, or the recorder failed): the problem screen, with Try again
    const found = checkCanRecord();
    if (found) return onCantStart?.(found);
    rootRef.current?.measureInWindow((rx, ry, rw) => {
      const k = width > 0 && rw > 0 ? width / rw : 1;
      onStartRecording?.({ x: (dial.x - rx + dial.width / 2) * k, y: (dial.y - ry + dial.height / 2) * k, r: (dial.button / 2) * k });
    });
  };

  // Latest startRecording (micOff changes once allowed), for the sheet's onAllowed.
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;

  // The gradient fills what shows above the tip sheet, brightest where the sheet begins.
  const heroHeight = stageTop > 0 ? stageTop + radius.sheet : 240;

  return (
    <View ref={rootRef} style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      {width > 0 && <AmbientGradient width={width} height={heroHeight} />}

      <View style={{ paddingTop: insets.top + PAGE_TITLE_TOP }}>
        <PageTitle title="Home" trailing={<Avatar initials={initials(profile)} onPress={onOpenProfile} />} />
      </View>

      <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setStageTop(e.nativeEvent.layout.y)}>
        <Banner message={message} onAction={onMessageAction} />

        <View style={styles.panel}>
          {/* The dial takes the room that's left, up to its full size */}
          <View style={styles.dialArea} onLayout={(e: LayoutChangeEvent) => setDialRoom(e.nativeEvent.layout)}>
            {dialSize > 0 && <RecordDial size={dialSize} note="Private. Recordings stay on this phone." ready={!micOff && !checkCanRecord()} onStart={startRecording} />}
          </View>
        </View>
      </View>

      <PermissionSheet
        kind={permKind}
        visible={permSheet !== null}
        onAllowed={() => {
          setPermSheet(null);
          const dial = pendingStart.current;
          pendingStart.current = null;
          if (dial && permKind === 'microphone') startRecordingRef.current(dial, true); // they were starting: carry on
        }}
        onNotNow={() => {
          setPermSheet(null);
          pendingStart.current = null;
        }}
      />
    </View>
  );
}

/**
 * The one message on Home: icon and text, then its action (a mini button) underneath, if it has one.
 * When the message changes (a permission turned on) the new one fades in (fast).
 * Breath with Midnight text (9.4:1); the action is a Midnight pill with a Moon label (15:1).
 */
function Banner({ message, onAction }: { message: HomeMessage; onAction: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const shown = useRef(message.id);
  useEffect(() => {
    if (shown.current === message.id) return;
    shown.current = message.id;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
  }, [message.id, fade]);

  return (
    <View style={styles.banner}>
      <Animated.View style={[styles.bannerRow, { opacity: fade }]}>
        <View style={styles.badge}>
          <Icon name={message.icon} size={24} color="onAccent" />
        </View>
        <View style={styles.bannerBody}>
          <AppText color="onAccent" accessibilityLiveRegion="polite">
            {message.text}
          </AppText>
          {message.cta && <Button label={message.cta} variant="mini" onPress={onAction} style={{ marginTop: space.md }} />}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  stage: { flex: 1, marginTop: space.xl },
  banner: {
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: PAGE_SIDE,
    paddingTop: space.xl,
    paddingBottom: PANEL_RADIUS + space.xl, // runs under the panel's rounded corners
  },
  bannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  bannerBody: { flex: 1, minWidth: 0 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.midnight, 0.1) },
  panel: {
    flex: 1,
    marginTop: -PANEL_RADIUS,
    borderTopLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: PANEL_RADIUS,
    backgroundColor: colors.background,
    paddingHorizontal: PAGE_SIDE,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  dialArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: space.lg, marginBottom: space.sm },
});
