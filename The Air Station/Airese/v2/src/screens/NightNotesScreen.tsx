import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText, BottomSheet, Button, ChipGroup, DetailPage, FormTitle, Icon, PAGE_SIDE, ToggleChip } from '../components';
import { NOTE_GROUPS, REMEDY_GROUPS, clearNightNotes, isRemedy, labelOf, ordered, saveTonight, summarize, useNightNotes, type NoteGroup } from '../lib/nightNotes';
import { alpha, colors, radius, space, type } from '@ds/theme';

/**
 * Night Notes: a short check-in before recording (about 15 seconds), opened from Home.
 * Natural questions with tap-to-choose pills, not a form. Remedies live in their own sheet,
 * grouped by what they're for. Done saves (and says how many are chosen); back leaves without saving.
 * "Same as last night?" appears once there are notes from a previous night.
 *
 * Same template as a night's details (DetailPage): "‹ Home", large title, sticky header.
 */
export function NightNotesScreen({ onClose, slideIn = Platform.OS === 'web', backLabel = 'Home' }: { onClose: () => void; slideIn?: boolean; /** Where Back goes: Home, or Recording when opened from its tips. */ backLabel?: string }) {
  const { height } = useWindowDimensions();
  const { tonight, lastNight } = useNightNotes();
  const [draft, setDraft] = useState<string[]>(tonight);
  const [remedies, setRemedies] = useState(false);

  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const usedLast = !!lastNight && lastNight.every((id) => draft.includes(id));
  const useLast = () => lastNight && setDraft((d) => ordered([...new Set([...d, ...lastNight])]));
  const chosenRemedies = ordered(draft.filter(isRemedy));

  return (
    <>
      <DetailPage
        backLabel={backLabel}
        title="Night Notes"
        subtitle="Add what may affect your sleep."
        onBack={onClose}
        slideIn={slideIn}
        footer={(leave) => (
          <Button
            label={draft.length ? `Done · ${draft.length} selected` : 'Done'}
            onPress={() => {
              saveTonight(draft);
              leave(onClose);
            }}
          />
        )}
      >
        <View style={styles.side}>
          {/* Shortcut: last night's notes in one tap */}
          {lastNight && lastNight.length > 0 && (
            <View style={styles.shortcut}>
              <View style={styles.shortcutIcon}>
                <Icon name="history" size={24} color="accent" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="button" color="text">
                  Same as last night?
                </AppText>
                <AppText variant="small" color="textMuted" numberOfLines={2} style={{ marginTop: 2 }}>
                  {summarize(lastNight)}
                </AppText>
              </View>
              <Pressable
                onPress={useLast}
                disabled={usedLast}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={usedLast ? 'Previous notes added' : 'Use previous notes'}
                style={({ pressed }) => [styles.shortcutAction, usedLast && styles.shortcutDone, pressed && { opacity: 0.8 }]}
              >
                {usedLast && <Icon name="check" size={16} color="accent" />}
                <AppText variant="small" color={usedLast ? 'accent' : 'onAccent'} style={styles.medium}>
                  {usedLast ? 'Added' : 'Use previous notes'}
                </AppText>
              </Pressable>
            </View>
          )}
          {/* Forget them: the previous notes and anything picked tonight */}
          {lastNight && lastNight.length > 0 && (
            <Pressable
              onPress={() => {
                clearNightNotes();
                setDraft([]);
              }}
              accessibilityRole="button"
              style={styles.forget}
            >
              <AppText variant="small" color="accent">
                Forget previous notes
              </AppText>
            </Pressable>
          )}

          {NOTE_GROUPS.map((group) => (
            <Question key={group.title} group={group} selected={draft} onToggle={toggle} />
          ))}

          {/* Remedies: chosen in a sheet, shown here once picked */}
          <View style={styles.question}>
            <AppText variant="button" color="text" accessibilityRole="header">
              Using anything tonight?
            </AppText>
            <AppText variant="small" color="textMuted" style={{ marginTop: 2 }}>
              To help with snoring or sleep
            </AppText>
            <View style={{ marginTop: space.md }}>
              <ChipGroup>
                {chosenRemedies.map((id) => (
                  <ToggleChip key={id} label={labelOf(id)} selected onToggle={() => toggle(id)} />
                ))}
                <Pressable onPress={() => setRemedies(true)} accessibilityRole="button" style={({ pressed }) => [styles.addRemedy, pressed && { opacity: 0.8 }]}>
                  <Icon name="add" size={18} color="accent" />
                  <AppText variant="small" color="accent" style={styles.medium}>
                    {chosenRemedies.length ? 'Add another' : 'Add remedy'}
                  </AppText>
                </Pressable>
              </ChipGroup>
            </View>
          </View>
        </View>
      </DetailPage>

      {/* Remedies, grouped by purpose */}
      <BottomSheet visible={remedies} onClose={() => setRemedies(false)} dragFrom="top">
        <AppText variant="heading" color="text" accessibilityRole="header" style={styles.center}>
          Add a remedy
        </AppText>
        <AppText variant="small" color="textMuted" style={[styles.center, { marginTop: space.xs }]}>
          Choose everything you’re using tonight.
        </AppText>
        <ScrollView style={{ maxHeight: height * 0.5, marginTop: space.lg }} showsVerticalScrollIndicator={false}>
          {REMEDY_GROUPS.map((group, i) => (
            <View key={group.title} style={{ marginTop: i ? space.xl : 0 }}>
              <FormTitle title={group.title} />
              <ChipGroup>
                {group.options.map((x) => (
                  <ToggleChip key={x.id} label={x.label} selected={draft.includes(x.id)} onToggle={() => toggle(x.id)} />
                ))}
              </ChipGroup>
            </View>
          ))}
        </ScrollView>
        <Button label={chosenRemedies.length ? `Done · ${chosenRemedies.length} selected` : 'Done'} onPress={() => setRemedies(false)} style={{ marginTop: space.xl }} />
      </BottomSheet>
    </>
  );
}

function Question({ group, selected, onToggle }: { group: NoteGroup; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.question}>
      <AppText variant="button" color="text" accessibilityRole="header">
        {group.title}
      </AppText>
      <View style={{ marginTop: space.md }}>
        <ChipGroup>
          {group.options.map((x) => (
            <ToggleChip key={x.id} label={x.label} selected={selected.includes(x.id)} onToggle={() => onToggle(x.id)} />
          ))}
        </ChipGroup>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { paddingHorizontal: PAGE_SIDE },
  forget: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: space.xs },
  shortcut: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface, // Deep
  },
  shortcutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.breath, 0.14) },
  shortcutAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  shortcutDone: { backgroundColor: 'transparent' },
  question: { marginTop: space.xxl },
  addRemedy: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  medium: { fontFamily: type.button.fontFamily, fontWeight: type.button.fontWeight },
  center: { textAlign: 'center' },
});
