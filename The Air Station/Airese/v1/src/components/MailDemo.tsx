import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { DEMO_CODE } from '../lib/emailCode';
import { setFrameBars } from '../lib/previewFrame';
import { radius, space, useInsets } from '@ds/theme';

/**
 * Browser preview only: stands in for the phone's mail app, open on the Airese code email
 * (public/email-code.html, the template developers use). Laid out like a mail app's message view,
 * titled "Mail", no mail provider's branding. Tapping the code (a link in the email) or "Copy code"
 * goes on to the Airese page in the browser (BrowserDemo).
 *
 * It's another app, so it's light, in a mail app's whites and greys, not Airese colours.
 */
const MAIL = { bg: '#FFFFFF', text: '#1F1F1F', muted: '#444746', chip: '#E9EEF6', line: '#C4C7C5' };

export function MailDemo({ onOpenCode, onBack }: { onOpenCode: () => void; onBack: () => void }) {
  const insets = useInsets();
  useEffect(() => (setFrameBars('dark'), () => setFrameBars('light')), []);

  const copy = () => {
    navigator.clipboard?.writeText(DEMO_CODE).catch(() => {});
    onOpenCode();
  };

  // The email's code is a link: catch the tap inside the email and go to the browser instead
  const onLoad = (e: { currentTarget: HTMLIFrameElement }) => {
    e.currentTarget.contentDocument?.addEventListener('click', (ev) => {
      if ((ev.target as Element | null)?.closest('a')) {
        ev.preventDefault();
        onOpenCode();
      }
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Airese" style={styles.icon}>
          <Icon name="chevron_left" size={28} color="midnight" />
        </Pressable>
        <AppText variant="heading" style={{ flex: 1, color: MAIL.text }} accessibilityRole="header">
          Mail
        </AppText>
        <View style={styles.icon}>
          <Icon name="delete" size={22} color="midnight" />
        </View>
        <View style={styles.icon}>
          <Icon name="mail" size={22} color="midnight" />
        </View>
      </View>

      <View style={styles.head}>
        <AppText variant="heading" style={{ color: MAIL.text }}>
          {DEMO_CODE} is your Airese code{' '}
        </AppText>
        <View style={styles.inbox}>
          <AppText variant="small" style={{ color: MAIL.muted }}>
            Inbox
          </AppText>
        </View>
      </View>

      <View style={styles.sender}>
        <Image source={require('../../assets/icon.png')} style={styles.avatar} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <AppText style={{ color: MAIL.text }}>
            Airese <AppText variant="small" style={{ color: MAIL.muted }}>  now</AppText>
          </AppText>
          <AppText variant="small" style={{ color: MAIL.muted }}>
            to me
          </AppText>
        </View>
      </View>

      <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={`Copy code ${DEMO_CODE.split('').join(' ')}`} style={({ pressed }) => [styles.copy, pressed && { opacity: 0.8 }]}>
        <AppText variant="small" style={{ color: MAIL.text }}>
          Copy code
        </AppText>
      </Pressable>

      <View style={styles.body}>
        {React.createElement('iframe', { src: 'email-code.html', title: 'Email: your Airese code', onLoad, style: { flex: 1, width: '100%', height: '100%', border: 0 } })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: MAIL.bg },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs, minHeight: 52 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, paddingHorizontal: space.gutter, paddingTop: space.sm },
  inbox: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: MAIL.chip },
  sender: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.gutter, paddingTop: space.lg },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  copy: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: space.md, marginLeft: space.gutter, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: MAIL.line },
  body: { flex: 1, marginTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: MAIL.line },
});
