import React, { useState } from 'react';
import { type ImageSourcePropType } from 'react-native';
import { PermissionSheet, PromptLayout } from '../components';
import { askPermission, type PermissionKind } from '../lib/permissionStatus';

type Props = {
  kind: PermissionKind;
  art: ImageSourcePropType;
  title: string;
  body: string;
  cta: string;
  /** Next step: after allowing, or after "Not now". */
  onDone?: () => void;
};

/**
 * Asks for one permission, explaining why first (layout: PromptLayout).
 * Allow → system prompt → next step.
 *
 * Second chance in a bottom sheet (PermissionSheet): after Skip, why it matters; after
 * "Don't Allow", how to turn it on in Settings. "Not now" moves on, and the sheet says it can be
 * turned on later from Home (where it comes back in context: see HomeScreen).
 */
export function PermissionScreen({ kind, art, title, body, cta, onDone }: Props) {
  const [asking, setAsking] = useState(false);
  const [sheet, setSheet] = useState(false);

  const allow = async () => {
    if (asking) return;
    setAsking(true);
    const status = await askPermission(kind);
    setAsking(false);
    if (status === 'granted') onDone?.();
    else setSheet(true); // said no: the sheet shows how to turn it on in Settings
  };

  const next = () => {
    setSheet(false);
    onDone?.();
  };

  return (
    <PromptLayout art={art} title={title} body={body} cta={cta} onCta={allow} onSkip={() => setSheet(true)}>
      <PermissionSheet kind={kind} visible={sheet} onAllowed={next} onNotNow={next} onDismiss={() => setSheet(false)} note="You can turn this on any time from Home." />
    </PromptLayout>
  );
}

// Copy as supplied by design (Oct 2026).

export function MicrophonePermissionScreen({ onDone }: { onDone?: () => void }) {
  return (
    <PermissionScreen
      kind="microphone"
      art={require('../../assets/permissions/microphone.png')}
      title="Let Airese listen while you sleep."
      body="Airese listens all night for snoring and breathing. Your recordings stay on your phone. Private and safe."
      cta="Allow microphone"
      onDone={onDone}
    />
  );
}

export function NotificationsPermissionScreen({ onDone }: { onDone?: () => void }) {
  return (
    <PermissionScreen
      kind="notifications"
      art={require('../../assets/permissions/notifications.png')}
      title="Turn on notifications."
      body="A reminder at bedtime, so you don’t miss a night."
      cta="Allow notifications"
      onDone={onDone}
    />
  );
}
