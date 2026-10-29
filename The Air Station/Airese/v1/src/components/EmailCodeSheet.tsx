import React, { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppText } from '@ds/components/AppText';
import { BottomSheet } from '@ds/components/BottomSheet';
import { Button } from '@ds/components/Button';
import { InlineLink } from '@ds/components/Checkbox';
import { Icon } from '@ds/components/Icon';
import { LargeSheet } from '@ds/components/LargeSheet';
import { MailDemo } from './MailDemo';
import { checkCode, CODE_MINUTES, DEMO_CODE, sendCode } from '../lib/emailCode';
import { colors, alpha, motion, radius, space } from '@ds/theme';


/**
 * Verify your email, after Verify in the email field (Create account, and Profile's Your details).
 * Two steps, so the person isn't met with code boxes before they have a code:
 *   sent   a short bottom sheet: where the code went, go and copy it.
 *   enter  coming back to the app: the large sheet with the code boxes and
 *          Paste code. The right code shows "Email verified", then the sheet closes by itself.
 * Flow: lib/emailCode.ts.
 *
 * Prototype only: "Demo: open the email" plays the mail app inside the phone (MailDemo); its Copy OTP
 * comes back to the enter step. In the real app the person switches to their mail app and back.
 */
export function EmailCodeSheet({ email, visible, startInMail = false, onVerified, onClose }: { email: string; visible: boolean; startInMail?: boolean; onVerified: () => void; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState<'sent' | 'mail' | 'enter'>('sent');
  const [copiedInDemo, setCopiedInDemo] = useState(false);

  // Opening: a fresh start
  const [open, setOpen] = useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) {
      setCode('');
      setError(undefined);
      setNote(undefined);
      setVerified(false);
      setStep(startInMail ? 'mail' : 'sent');
      setCopiedInDemo(false);
    }
  }

  // Back in the app from the mail app: on to the code boxes
  useEffect(() => {
    if (!visible || step !== 'sent' || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => state === 'active' && setStep('enter'));
    return () => sub.remove();
  }, [visible, step]);

  useEffect(() => {
    if (!verified) return;
    const t = setTimeout(onClose, motion.hold);
    return () => clearTimeout(t);
  }, [verified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed or pasted: checked once all 6 digits are in
  const enter = async (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(undefined);
    setNote(undefined);
    if (digits.length < 6) return;
    if (await checkCode(digits)) {
      onVerified();
      setVerified(true);
    } else setError('That code doesn’t match. Copy it again from the email.');
  };

  const paste = async () => {
    let text = '';
    try {
      text = await Clipboard.getStringAsync();
    } catch {
      // Clipboard blocked (the browser preview may refuse): fall through
    }
    // Demo: if the browser won't share the clipboard, use the code Copy OTP just copied
    const found = text.match(/\d{6}/)?.[0] ?? (copiedInDemo ? DEMO_CODE : undefined);
    if (found) enter(found);
    else setError('There’s no code to paste yet. Copy it from the email first.');
  };

  const resend = async () => {
    await sendCode(email);
    setCode('');
    setError(undefined);
    setNote('New code sent.');
  };

  return (
    <>
      <LargeSheet visible={visible && step === 'enter'} title={verified ? 'Email verified' : 'Check your email'} onClose={onClose}>
        {verified ? (
          <View style={[styles.page, styles.done]} accessibilityLiveRegion="polite">
            <Icon name="check_circle" size={56} color="accent" />
            <AppText color="textMuted" style={{ textAlign: 'center' }}>
              {email} is verified.
            </AppText>
          </View>
        ) : (
          <View style={styles.page}>
            <AppText color="textMuted">
              Enter the code sent to{'\n'}
              {email}
            </AppText>

            {/* Six boxes; one invisible field on top takes typing, AutoFill and paste */}
            <View style={styles.slots}>
              {Array.from({ length: 6 }, (_, k) => (
                <View key={k} style={[styles.slot, code[k] ? styles.slotFilled : null, error ? styles.slotError : null]}>
                  <AppText variant="headline">{code[k] ?? ''}</AppText>
                </View>
              ))}
              <TextInput
                value={code}
                onChangeText={enter}
                accessibilityLabel="Code from the email"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                caretHidden
                style={styles.field}
              />
            </View>
            {error ? (
              <AppText variant="small" style={{ color: colors.error, marginTop: space.sm }} accessibilityLiveRegion="polite">
                {error}
              </AppText>
            ) : null}

            <Button label="Paste code" onPress={paste} style={{ marginTop: space.xl }} />
            <AppText variant="small" color="textMuted" style={{ textAlign: 'center', marginTop: space.lg }} accessibilityLiveRegion="polite">
              {note ?? `Works for ${CODE_MINUTES} minutes · `}
              {note ? null : <InlineLink onPress={resend}>Send a new code</InlineLink>}
            </AppText>

          </View>
        )}
      </LargeSheet>

      <BottomSheet visible={visible && step === 'sent'} onClose={onClose} fit>
        <AppText variant="heading" accessibilityRole="header">
          Check your email
        </AppText>
        <AppText color="textMuted" style={{ marginTop: space.sm }}>
          We sent a 6-digit code to{'\n'}
          {email}
          {'\n'}Copy it, then come back here to paste it.
        </AppText>
        <DemoLink onPress={() => setStep('mail')} />
      </BottomSheet>

      {/* Prototype only: the mail app, inside the phone */}
      {visible && step === 'mail' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 70 }]}>
          <MailDemo onCopied={() => (setCopiedInDemo(true), setStep('enter'))} onBack={() => setStep('sent')} />
        </View>
      )}
    </>
  );
}

/** Prototype only: plays the mail app inside the phone. */
function DemoLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={({ pressed }) => [styles.demo, pressed && { opacity: 0.7 }]}>
      <AppText variant="small" color="textMuted">
        Demo: open the email
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: space.sm },
  done: { alignItems: 'center', justifyContent: 'center', gap: space.md, paddingBottom: space.xxl },
  slots: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  slot: { flex: 1, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  slotFilled: { borderColor: alpha(colors.moon, 0.24) },
  slotError: { borderColor: colors.errorMark },
  field: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0 },
  demo: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, marginTop: space.lg },
});
