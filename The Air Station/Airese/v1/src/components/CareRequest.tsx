import React, { useMemo } from 'react';
import { AppText } from '@ds/components/AppText';
import { BottomSheet } from '@ds/components/BottomSheet';
import { Button } from '@ds/components/Button';
import { ExplainSheet } from '@ds/components/ExplainSheet';
import { Logo } from '@ds/components/Logo';
import { space } from '@ds/theme';
import { phoneDisplay, useProfile } from '../lib/profile';

/**
 * "Talk to our sleep care team": one tap registers the request, and this sheet says thanks and when
 * to expect a call. The same words and icon everywhere it appears (Profile, Our centres, the night report).
 * Engineering: send the request (name, phone, recent nights summary) to The Air Station.
 */
export const CARE_CTA = { label: 'Talk to our sleep care team', icon: 'record_voice_over' } as const;

export function CareRequestSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const profile = useProfile();
  const phone = profile.phone ? ` on ${phoneDisplay(profile)}` : '';
  // Memoised: ExplainSheet keeps its last content by identity
  const content = useMemo(
    () => ({
      title: 'Thanks, we’ll be in touch',
      body: `Thanks for your interest in speaking to our sleep care team. We’ll call you${phone} within 3 working days.`,
    }),
    [phone],
  );
  return <ExplainSheet content={visible ? content : null} onClose={onClose} dismissLabel="Done" />;
}

/**
 * From a night's report: before the request is sent, a sheet with the Airese logo (who's asking) says the
 * night's data will be shared, and asks to go ahead (Request a call back) or not (Not now). Same layout as
 * ExplainSheet, plus the logo. Request sends it; the screen confirms with a toast.
 * Engineering: on Request, send the triggering night's data (the CRM payload) to the sleep care team.
 */
export function CareConfirmSheet({ visible, onRequest, onClose }: { visible: boolean; onRequest: () => void; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} fit>
      <Logo width={48} />
      <AppText variant="heading" color="text" accessibilityRole="header" style={{ marginTop: space.lg }}>
        Thank you for showing your interest to connect with Airese sleep care team
      </AppText>
      <AppText color="textMuted" style={{ marginTop: space.sm }}>
        Once you proceed with the request, your night’s data will be shared with the sleep care team.
      </AppText>
      <AppText color="textMuted" style={{ marginTop: space.md }}>
        Someone from our team will get in touch with you soon.
      </AppText>
      <Button label="Request a call back" onPress={onRequest} style={{ marginTop: space.xl }} />
      <Button label="Not now" variant="quiet" onPress={onClose} style={{ marginTop: space.sm }} />
    </BottomSheet>
  );
}
