import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { trioLayout } from '../../components/ReportTrio';
import { startAnalysing } from '../../lib/recordings';
import { ReportsScreen } from '../../screens/ReportsScreen';

/**
 * ?state=…: the demo menu's Recording Details states, on the latest night (prototype only).
 * ?state=processing is the same as stopping a recording. Not a key: switching tabs clears the param,
 * and that must not reload the page.
 */
export default function Reports() {
  const { state, layout } = useLocalSearchParams<{ state?: string; layout?: string }>();
  useState(() => state === 'processing' && startAnalysing());
  return (
    <ReportsScreen
      demoState={state === 'processing' ? undefined : state}
      trio={trioLayout(layout)}
      onRecordAgain={() => router.navigate('/home')}
      onOpenNotes={(night) => router.push({ pathname: '/night-notes', params: { night: night.id } })}
    />
  );
}
