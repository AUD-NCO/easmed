import React, { useState } from 'react';
import { space } from '../theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

/**
 * L2: a short explanation in a bottom sheet (title, a few plain sentences, optional action).
 * Dismissing returns to exactly where the user was.
 */
export function ExplainSheet({ content, onClose, action, dismissLabel = 'Got it' }: { content: { title: string; body: string } | null; onClose: () => void; action?: { label: string; onPress: () => void }; dismissLabel?: string }) {
  // Keep showing the last content while the sheet slides away.
  const [shown, setShown] = useState(content);
  if (content && content !== shown) setShown(content);
  return (
    <BottomSheet visible={!!content} onClose={onClose} fit>
      <AppText variant="heading" color="text" accessibilityRole="header">
        {shown?.title}
      </AppText>
      <AppText color="textMuted" style={{ marginTop: space.sm }}>
        {shown?.body}
      </AppText>
      {action ? <Button label={action.label} onPress={action.onPress} style={{ marginTop: space.xl }} /> : null}
      <Button label={dismissLabel} variant={action ? 'quiet' : 'primary'} onPress={onClose} style={{ marginTop: action ? space.sm : space.xl }} />
    </BottomSheet>
  );
}
