import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailPage, PAGE_SIDE } from '../components';
import { space } from '@ds/theme';

export type LegalDoc = 'terms' | 'privacy';

const TITLES: Record<LegalDoc, string> = { terms: 'Terms and Conditions', privacy: 'Privacy Policy' };

/**
 * Terms and Conditions / Privacy Policy, opened from the agreement on the details screen.
 * Placeholder page for now: it stands in for the in-app browser.
 * Engineering: open the published pages with expo-web-browser (openBrowserAsync) once they have URLs.
 */
export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }) {
  return (
    <DetailPage backLabel="Back" title={TITLES[doc]} onBack={onBack}>
      <View style={styles.body}>
        <AppText color="textMuted">The full text will appear here.</AppText>
      </View>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl },
});
