import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { InfoButton } from './InfoButton';

/**
 * The surface for a piece of content: Deep, 16 pt corners, 20 pt padding.
 * Optional title row with an (i) that opens an explanation (an L2 bottom sheet).
 */
export function Card({ children, style, title, onInfo, infoLabel }: { children: React.ReactNode; style?: ViewStyle; title?: string; onInfo?: () => void; infoLabel?: string }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <AppText variant="button" color="text" accessibilityRole="header" style={{ flex: 1 }}>
            {title}
          </AppText>
          {onInfo ? <InfoButton size={22} onPress={onInfo} label={infoLabel ?? `About ${title}`} /> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.gutter },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md, minHeight: 24 },
});
