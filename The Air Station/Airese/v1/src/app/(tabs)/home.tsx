import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { setDemoLastNightStopped, setDemoStartProblem } from '../../lib/recordingIssues';
import { HomeScreen } from '../../screens/HomeScreen';

/**
 * ?state=…: the demo nav's Home states. Prototype only.
 *   after-stopped-night  last night's recording stopped early: the banner points to it
 */
export default function Home() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  useState(() => {
    setDemoStartProblem(null);
    setDemoLastNightStopped(state === 'after-stopped-night' ? 'stopped-phone' : null);
  });
  return (
    <HomeScreen
      onOpenProfile={() => router.push('/profile')}
      onOpenLastNight={(night) => {
        setDemoLastNightStopped(null); // seen
        router.navigate({ pathname: '/reports', params: { state: night } });
      }}
      onCantStart={(kind) => router.push({ pathname: '/recording-problem', params: { kind } })}
      onStartRecording={(from) => router.push({ pathname: '/recording', params: { x: String(from.x), y: String(from.y), r: String(from.r) } })}
    />
  );
}
