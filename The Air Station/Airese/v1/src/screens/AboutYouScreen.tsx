import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ABOUT_WHY, AboutYou, AppText, Button, ExplainSheet, InfoButton, missingAbout, missingAboutMessage, type AboutKey } from '../components';
import { setProfile, useProfile, type Profile } from '../lib/profile';
import { colors, space, useInsets } from '@ds/theme';

/**
 * Set-up, last step (after Your details): gender, age, height, weight and where you live, as a
 * list to fill in one by one, all required. Headline with (i) (why we ask), one line saying all are needed.
 * Begin your journey → Home.
 */
export function AboutYouScreen({ onDone }: { onDone?: () => void }) {
  const insets = useInsets();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [why, setWhy] = useState(false);
  const [missing, setMissing] = useState<AboutKey[]>([]); // shown once Begin is tapped with gaps

  const update = (next: Partial<Profile>) => {
    const d = { ...draft, ...next };
    setDraft(d);
    // Clear rings as answers come in (never add new ones before the next tap)
    if (missing.length) setMissing(missingAbout(d).filter((k) => missing.includes(k)));
  };

  const submit = () => {
    const gaps = missingAbout(draft);
    setMissing(gaps);
    if (gaps.length) return;
    setProfile(draft);
    onDone?.();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.xxl, paddingBottom: space.xl, paddingHorizontal: space.gutter }}>
        <View style={styles.head}>
          <AppText variant="headline" accessibilityRole="header" style={{ flexShrink: 1 }}>
            One last step
          </AppText>
          <InfoButton size={24} onPress={() => setWhy(true)} label="Why we ask about you" />
        </View>

        <AppText color="textMuted" style={{ marginTop: space.xs }}>
          All five are needed to begin.
        </AppText>

        <View style={{ marginTop: space.xl }}>
          <AboutYou value={draft} onChange={update} heading={false} missing={missing} error={missing.length ? missingAboutMessage(missing) : undefined} />
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Button label="Begin your journey" onPress={submit} />
      </View>

      <ExplainSheet content={why ? ABOUT_WHY : null} onClose={() => setWhy(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bottom: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
});
