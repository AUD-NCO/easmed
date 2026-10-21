import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, DetailPage, FormTitle, Icon, IconChoiceGrid, PAGE_SIDE } from '../components';
import { BEFORE_SLEEP, REMEDY_GROUPS, isRemedy, nightEntry, previousNotes, saveNight, saveTonight, useNightNotes } from '../lib/nightNotes';
import { formatNightDate, useNights, type Night } from '../lib/recordings';
import { space } from '@ds/theme';

/**
 * The Sleep Diary (code: Night Notes), as a page of icons to tap (IconChoiceGrid), in two places:
 *   Recording (no `night`): Bedtime check-in, what happened before sleep. Saved for tonight; it goes with the night when recording stops.
 *   A night's report (`night`): Morning check-in, the sleep remedies used that night, grouped by what they're for.
 *     Saved to that night, alongside its Before sleeping.
 * "Same as last night" fills in the previous night's choices in one tap (shown while there are any to add).
 * Done saves (and says how many are chosen); back leaves without saving.
 * Same template as a night's details (DetailPage): "‹ Back", large title, sticky header.
 */
export function NightNotesScreen({ night, onClose, slideIn = Platform.OS === 'web', backLabel = 'Recording' }: { night?: Night; onClose: () => void; slideIn?: boolean; backLabel?: string }) {
  const notes = useNightNotes();
  const [draft, setDraft] = useState<string[]>(night ? nightEntry(notes, night.id).notes : notes.tonight);
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const count = night ? draft.filter(isRemedy).length : draft.length;
  const toAdd = previousNotes(notes, useNights(), !!night, night?.id).filter((id) => !draft.includes(id));

  return (
    <DetailPage
      backLabel={backLabel}
      title={night ? 'Morning check-in' : 'Bedtime check-in'}
      subtitle={night ? `Any sleep remedies? · ${formatNightDate(night.date)}` : 'Anything that may affect tonight.'}
      onBack={onClose}
      slideIn={slideIn}
      footer={(leave) => (
        <Button
          label={count ? `Done · ${count} selected` : 'Done'}
          onPress={() => {
            if (night) saveNight(night.id, draft);
            else saveTonight(draft);
            leave(onClose);
          }}
        />
      )}
    >
      <View style={styles.side}>
        {toAdd.length > 0 && (
          <Pressable onPress={() => setDraft((d) => [...d, ...toAdd])} accessibilityRole="button" hitSlop={4} style={({ pressed }) => [styles.same, pressed && { opacity: 0.7 }]}>
            <Icon name="history" size={20} color="accent" />
            <AppText color="accent">Same as last night</AppText>
          </Pressable>
        )}
        {night ? (
          REMEDY_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <FormTitle title={group.title} />
              <IconChoiceGrid options={group.options} selected={draft} onToggle={toggle} />
            </View>
          ))
        ) : (
          <View style={styles.group}>
            <IconChoiceGrid options={BEFORE_SLEEP} selected={draft} onToggle={toggle} />
          </View>
        )}
      </View>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  side: { paddingHorizontal: PAGE_SIDE },
  group: { marginTop: space.lg },
  same: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: space.sm, minHeight: 44, marginTop: space.md },
});
