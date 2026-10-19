import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../theme';
import { AppText } from './AppText';

/** Standard screen edge, shared by page titles and content across the app. */
export const PAGE_SIDE = space.gutter;
/** Space between the status bar and a tab's page title (added to insets.top). */
export const PAGE_TITLE_TOP = space.lg;

/**
 * Large page title for a tab's own page (Home, Reports): the same size, colour (Moon), inset and
 * row height on every tab, with an optional control on the right (Home: the avatar; Reports: the
 * calendar), centred on the title line. The screen adds the top spacing: PAGE_TITLE_TOP.
 */
export function PageTitle({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText variant="title" color="text" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </AppText>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.lg, paddingHorizontal: PAGE_SIDE },
});
