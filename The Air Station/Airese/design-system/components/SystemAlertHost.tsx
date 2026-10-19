import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * BROWSER PREVIEW ONLY. A stand-in for the iOS system permission alert, so the
 * flow can be reviewed in a browser. Renders nothing on iOS and Android, where
 * the real system prompt appears instead.
 *
 * It imitates the operating system's UI on purpose, so it uses iOS's own styling
 * (system font, iOS dark-mode alert colours) rather than Airese tokens.
 */
type Alert = { title: string; message: string; resolve: (allowed: boolean) => void };

let show: ((a: Alert) => void) | null = null;

export function showSystemAlert({ title, message }: { title: string; message: string }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) return resolve(false);
    show({ title, message, resolve });
  });
}

/** Mount once at the root (web only). */
export function SystemAlertHost() {
  const [alert, setAlert] = useState<Alert | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    show = setAlert;
    return () => {
      show = null;
    };
  }, []);
  if (Platform.OS !== 'web' || !alert) return null;

  const answer = (allowed: boolean) => {
    alert.resolve(allowed);
    setAlert(null);
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card} accessibilityRole="alert">
        <View style={styles.body}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.message}>{alert.message}</Text>
        </View>
        <View style={styles.buttons}>
          <Pressable style={styles.button} onPress={() => answer(false)} accessibilityRole="button">
            <Text style={styles.buttonText}>Don’t Allow</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.button} onPress={() => answer(true)} accessibilityRole="button">
            <Text style={[styles.buttonText, styles.allow]}>Allow</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const ios = '-apple-system, "SF Pro Text", system-ui, sans-serif';
const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { width: 270, borderRadius: 14, backgroundColor: 'rgba(37,37,39,0.96)', overflow: 'hidden' },
  body: { paddingHorizontal: 16, paddingTop: 19, paddingBottom: 18, gap: 4 },
  title: { fontFamily: ios, fontSize: 17, lineHeight: 22, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  message: { fontFamily: ios, fontSize: 13, lineHeight: 18, color: '#FFFFFF', textAlign: 'center' },
  buttons: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(84,84,88,0.65)' },
  button: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(84,84,88,0.65)' },
  buttonText: { fontFamily: ios, fontSize: 17, color: '#0A84FF' },
  allow: { fontWeight: '600' },
});
