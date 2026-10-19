import React from 'react';
import { View } from 'react-native';
import type { Trend } from '../lib/nightDetails';
import { space } from '@ds/theme';
import { AppText } from '@ds/components/AppText';
import { Icon, type IconName } from '@ds/components/Icon';

const ICON: Record<Trend, IconName> = { less: 'trending_down', same: 'trending_flat', more: 'trending_up' };

/**
 * How a value compares with the user's own recent nights: a trend arrow and plain words
 * ("Less than usual"). Neutral Mist on purpose: no green for good or red for bad.
 */
export function ComparisonIndicator({ trend, words }: { trend: Trend; words: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Icon name={ICON[trend]} size={16} color="textMuted" />
      <AppText variant="caption" color="textMuted" style={{ flexShrink: 1 }}>
        {words}
      </AppText>
    </View>
  );
}
