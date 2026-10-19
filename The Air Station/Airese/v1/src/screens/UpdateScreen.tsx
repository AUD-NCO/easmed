import React from 'react';
import { Platform } from 'react-native';
import { PromptLayout } from '../components';
import { openStore } from '../lib/appUpdate';

const STORE = Platform.OS === 'android' ? 'Google Play' : 'the App Store';

/**
 * Asks the user to update the app (layout: PromptLayout, as the permission screens).
 * Shown outside the usual flow, when the server says this version is too old.
 * Updates are forced for now (Oct 2026): no Skip, no way past it. What's new is told
 * in the store listing, not here. "Update now" opens the store page.
 */
export function UpdateScreen() {
  return (
    <PromptLayout
      art={require('../../assets/prompts/update.png')}
      title="Update Airese to keep recording."
      body={`This version is out of date. Your recordings and reports stay on your phone. See what's new in ${STORE}.`}
      cta="Update now"
      onCta={openStore}
    />
  );
}
