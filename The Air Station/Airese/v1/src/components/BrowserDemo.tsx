import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { demoPageUrl, VERIFY_DOMAIN, type CodeFrom } from '../lib/emailCode';
import { setFrameBars } from '../lib/previewFrame';
import { radius, space, useInsets } from '@ds/theme';

/**
 * Browser preview only: stands in for the phone's browser, opened from the code in the email
 * (MailDemo). Shows the Airese page (public/verify-email.html) with the code filled in, and the
 * address bar at the bottom as on iPhone. Verified → the page sends the person back to the app.
 * It's another app, so it's light, in a browser's whites and greys, not Airese colours.
 */
const BROWSER = { bg: '#FFFFFF', bar: '#F2F2F7', field: '#E3E3E8', text: '#1F1F1F' };

export function BrowserDemo({ email, from, onVerified, onChangeEmail, onBack }: { email: string; from: CodeFrom; onVerified: () => void; onChangeEmail: () => void; onBack: () => void }) {
  const insets = useInsets();
  useEffect(() => (setFrameBars('dark'), () => setFrameBars('light')), []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.source !== 'airese-verify') return;
      if (e.data.result === 'verified') onVerified();
      else onChangeEmail();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onVerified, onChangeEmail]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {React.createElement('iframe', { src: demoPageUrl(email, from), title: 'Verify your email', style: { flex: 1, width: '100%', border: 0 } })}
      <View style={[styles.bar, { paddingBottom: insets.bottom + space.xs }]}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Mail" style={styles.icon}>
          <Icon name="chevron_left" size={28} color="midnight" />
        </Pressable>
        <View style={styles.address} accessibilityRole="text" accessibilityLabel={`Address: ${VERIFY_DOMAIN}`}>
          <Icon name="lock" size={14} color="midnight" />
          <AppText variant="small" style={{ color: BROWSER.text }}>
            {VERIFY_DOMAIN}
          </AppText>
        </View>
        <View style={styles.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BROWSER.bg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingTop: space.sm, backgroundColor: BROWSER.bar },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  address: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, borderRadius: radius.pill, backgroundColor: BROWSER.field },
});
