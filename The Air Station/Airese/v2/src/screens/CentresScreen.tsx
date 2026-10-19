import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailPage, Icon, Logo, PAGE_SIDE, type IconName } from '../components';
import { CENTRES, SUPPORT, directionsUrl, type Centre } from '../lib/airStation';
import { alpha, colors, radius, space } from '@ds/theme';

/**
 * Our centres (Profile → Our centres): where The Air Station's sleep care team sees people.
 * One card per centre: name and area, address, opening hours, then Call and Directions.
 * A quiet brand line at the end. Prototype: centre details are placeholders (lib/airStation.ts).
 */
export function CentresScreen({ onBack }: { onBack: () => void }) {
  return (
    <DetailPage backLabel="Profile" title="Our centres" subtitle="The Air Station sleep care team" onBack={onBack}>
      <View style={styles.body}>
        <AppText color="textMuted">Talk to someone who can go through your recent nights with you and suggest what to do next.</AppText>

        {CENTRES.map((c) => (
          <CentreCard key={c.id} c={c} />
        ))}

        <View style={styles.callAll}>
          <AppText color="text">Not sure which centre?</AppText>
          <AppText variant="small" color="textMuted">{`Call us, ${SUPPORT.hours.charAt(0).toLowerCase()}${SUPPORT.hours.slice(1)}.`}</AppText>
          <Action icon="call" label="Call us" onPress={() => Linking.openURL(`tel:${SUPPORT.phone}`).catch(() => {})} style={{ marginTop: space.lg, alignSelf: 'flex-start' }} />
        </View>

        <View style={styles.brand} accessible accessibilityLabel="Airese, powered by The Air Station">
          <Logo width={44} color="mist" />
          <AppText variant="small" color="textMuted" style={{ marginTop: space.md }}>
            Powered by The Air Station
          </AppText>
        </View>
      </View>
    </DetailPage>
  );
}

function CentreCard({ c }: { c: Centre }) {
  return (
    <View style={styles.card}>
      <AppText variant="heading" color="text" accessibilityRole="header">
        {c.area}
      </AppText>
      <AppText variant="small" color="textMuted">
        {c.name}
      </AppText>

      <View style={styles.lines}>
        <Line icon="location_on" text={c.address} />
        <Line icon="schedule" text={c.hours} />
      </View>

      <View style={styles.actions}>
        <Action icon="call" label="Call" onPress={() => Linking.openURL(`tel:${c.phone}`).catch(() => {})} accessibilityLabel={`Call ${c.name}, ${c.area}`} />
        <Action icon="location_on" label="Directions" onPress={() => Linking.openURL(directionsUrl(c)).catch(() => {})} accessibilityLabel={`Directions to ${c.name}, ${c.area}`} />
      </View>
    </View>
  );
}

function Line({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.line}>
      <Icon name={icon} size={20} color="textMuted" />
      <AppText color="text" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

function Action({ icon, label, onPress, accessibilityLabel, style }: { icon: IconName; label: string; onPress: () => void; accessibilityLabel?: string; style?: object }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={({ pressed }) => [styles.action, style, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={20} color="accent" />
      <AppText color="accent">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.lg, gap: space.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  lines: { gap: space.sm, marginTop: space.lg },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: alpha(colors.breath, 0.5) },
  callAll: { paddingVertical: space.lg },
  brand: { alignItems: 'center', paddingTop: space.xxl, paddingBottom: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
});
