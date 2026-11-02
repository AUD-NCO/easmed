import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@ds/components/AppText';
import { Icon } from '@ds/components/Icon';
import { LargeSheet } from '@ds/components/LargeSheet';
import { alpha, colors, radius, space } from '@ds/theme';
import { REMEDY_GROUPS } from '../lib/nightNotes';

/** One plain line on what each remedy does. Not medical advice, and no product names. */
const HINT: Record<string, string> = {
  'side-sleeping': 'Lying on your side keeps the airway more open than lying on your back.',
  'wedge-pillow': 'Raises your head and chest a little.',
  'positional-therapy': 'A belt or small device that keeps you off your back.',
  'anti-snore-pillow': 'Shaped to keep your head and neck in line.',
  'nasal-strip': 'Sticks across your nose and gently opens the nostrils.',
  'nasal-dilator': 'Sits just inside the nostrils to hold them open.',
  'nasal-spray': 'A salt-water spray clears a stuffy nose before bed.',
  'neti-pot': 'Rinses the nose with salt water.',
  'allergy-relief': 'Eases a nose blocked by allergies. A pharmacist can suggest one.',
  mouthpiece: 'Holds your lower jaw slightly forward while you sleep.',
  'tongue-retainer': 'Keeps your tongue from falling back.',
  'mouth-tape': 'Gentle tape that helps you breathe through your nose.',
  'throat-spray': 'Coats the throat. Some people find it helps.',
  'chin-strap': 'Keeps your mouth closed while you sleep.',
  'air-purifier': 'Cuts dust and pollen in the bedroom.',
  humidifier: 'Adds moisture, so your nose and throat feel less dry.',
};

/**
 * "Use a remedy" (the round button beside the verdict on an unusual night): the remedies people can
 * try tonight, grouped as in the Morning check-in, each with one plain line on what it does.
 */
export function RemediesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <LargeSheet visible={visible} title="Remedies to try" onClose={onClose}>
      <View style={styles.body}>
        <AppText color="textMuted">Things that help some people snore less.</AppText>
        {REMEDY_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <AppText variant="small" color="textMuted" accessibilityRole="header" style={{ marginBottom: space.sm }}>
              {group.title}
            </AppText>
            {group.options.map((r) => (
              <View key={r.id} style={styles.row} accessible accessibilityLabel={`${r.label}. ${HINT[r.id] ?? ''}`}>
                <View style={styles.icon}>
                  <Icon name={r.icon} size={24} color="text" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText color="text">{r.label}</AppText>
                  {HINT[r.id] ? (
                    <AppText variant="small" color="textMuted">
                      {HINT[r.id]}
                    </AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}
        <AppText variant="small" color="textMuted">Not medical advice. If the snoring keeps up, talk to our sleep care team.</AppText>
      </View>
    </LargeSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.xl, paddingTop: space.sm },
  group: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.mist, 0.1) },
});
