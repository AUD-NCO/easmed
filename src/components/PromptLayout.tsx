import React from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';
import { alpha, colors, space, useInsets } from '../theme';

const ART = 200; // graphic size (pt)

type Props = {
  /** Left out: a placeholder until the graphic is ready. */
  art?: ImageSourcePropType;
  title: string;
  body: string;
  /** How to solve it: one line, marked with a lightbulb (recording problems). */
  fix?: string;
  cta: string;
  onCta: () => void;
  /** Top right: "Skip" or a close ×. */
  onSkip?: () => void;
  onClose?: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
};

/**
 * Full-screen prompt: permissions, the update screen and recording problems (Figma "iPhone 16 & 17 Pro - 7/8").
 * Image, then problem (headline), reason (body), how to solve (fix) and one button, anchored low
 * in thumb reach. Top right: Skip or a close ×.
 * `children` sit over the screen (a bottom sheet).
 */
export function PromptLayout({ art, title, body, fix, cta, onCta, onSkip, onClose, closeLabel = 'Close', children }: Props) {
  const insets = useInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl * 2 }]}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        {onSkip && (
          <Pressable onPress={onSkip} style={styles.skip} accessibilityRole="button" accessibilityLabel="Skip">
            <AppText variant="small" style={styles.skipText}>
              Skip
            </AppText>
          </Pressable>
        )}
        {onClose && (
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel={closeLabel}>
            <Icon name="close" size={24} color="text" />
          </Pressable>
        )}
      </View>

      <View style={styles.page}>
        <PromptBody art={art} title={title} body={body} fix={fix} cta={cta} onCta={onCta} />
      </View>

      {children}
    </View>
  );
}

/**
 * The prompt itself: graphic centred in the space it's given, then problem, reason, how to solve and
 * the button, anchored low. Fills its parent (give it a flex: 1 parent with the page's side inset).
 * Used full screen (PromptLayout) and inside a page with its own header (a problem night on Reports).
 */
export function PromptBody({ art, title, body, fix, cta, onCta }: Pick<Props, 'art' | 'title' | 'body' | 'fix' | 'cta' | 'onCta'>) {
  return (
    <>
      {/* Graphic is there from the start: no entrance or ambient animation on these screens */}
      <View style={styles.artArea}>
        {art ? (
          <Image source={art} style={{ width: ART, height: ART }} accessible={false} />
        ) : (
          // Prototype: the graphic is still to come
          <View style={styles.placeholder} accessible={false} importantForAccessibility="no-hide-descendants">
            <AppText variant="small" color="textMuted">
              Image to come
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.text}>
        <AppText variant="headline" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted" style={{ marginTop: space.sm }}>
          {body}
        </AppText>
        {fix ? (
          <View style={styles.fix}>
            <Icon name="lightbulb" size={20} color="lamp" />
            <AppText color="text" style={{ flex: 1 }}>
              {fix}
            </AppText>
          </View>
        ) : null}
        <Button label={cta} onPress={onCta} style={{ marginTop: space.xl }} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  // Same height with or without Skip, so the graphic doesn't move between screens.
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.lg, minHeight: 44 },
  // 44 pt tap target; text lines up 32 pt from the right edge, as in Figma.
  skip: { minWidth: 44, height: 44, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  skipText: { textTransform: 'uppercase', letterSpacing: 1 },
  close: { width: 44, height: 44, marginRight: space.sm, alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: ART, height: ART, borderRadius: ART / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: alpha(colors.moon, 0.3), backgroundColor: alpha(colors.moon, 0.04) },
  fix: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.md },
  artArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Same height on every prompt screen (room for a 2-line headline, 4 lines of body and the
  // button), so the graphic sits in the same place as you move from one screen to the next.
  text: { minHeight: 240, justifyContent: 'flex-end' },
  page: { flex: 1, paddingHorizontal: space.gutter },
});
