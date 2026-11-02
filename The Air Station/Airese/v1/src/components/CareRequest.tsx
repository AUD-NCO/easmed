import React, { useMemo } from 'react';
import { ExplainSheet } from '@ds/components/ExplainSheet';
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
