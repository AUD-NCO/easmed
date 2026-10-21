import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, DetailPage, FormTitle, IconChoiceGrid, PAGE_SIDE } from '../components';
import { BEFORE_SLEEP, REMEDY_GROUPS, isRemedy, nightEntry, saveNight, saveTonight, useNightNotes } from '../lib/nightNotes';
import { formatNightDate, type Night } from '../lib/recordings';
import { space } from '@ds/theme';

/**
 * Night Notes, as a page of icons to tap (IconChoiceGrid), in two places:
 *   Recording (no `night`): Before sleeping. Saved for tonight; it goes with the night when recording stops.
 *   A night's report (`night`): the sleep remedies used that night, grouped by what they're for.
 *     Saved to that night, alongside its Before sleeping.
 * Done saves (and says how many are chosen); back leaves without saving.
 * Same template as a night's details (DetailPage): "‹ Back", large title, sticky header.
 */
export function NightNotesScreen({ night, onClose, slideIn = Platform.OS === 'web', backLabel = 'Recording' }: { night?: Night; onClose: () => void; slideIn?: boolean; backLabel?: string }) {
  const notes = useNightNotes();
  const [draft, setDraft] = useState<string[]>(night ? nightEntry(notes, night.id).notes : notes.tonight);
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const count = night ? draft.filter(isRemedy).length : draft.length;

  return (
    <DetailPage
      backLabel={backLabel}
      title={night ? 'Any sleep remedies?' : 'Before sleeping'}
      subtitle={night ? formatNightDate(night.date) : 'Anything that may affect tonight.'}
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
});
