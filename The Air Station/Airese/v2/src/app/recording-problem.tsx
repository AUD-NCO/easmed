import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { setDemoStartProblem } from '../lib/recordingIssues';
import { StartProblemScreen } from '../screens/ProblemScreen';

// Recording can't start: ?kind=space (not enough space) or ?kind=start (the recorder failed).
export default function RecordingProblem() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const problem = kind === 'start' ? 'start' : 'space';
  useState(() => setDemoStartProblem(problem)); // prototype: the demo nav lands here directly
  return (
    <StartProblemScreen
      problem={problem}
      onRecord={() => router.replace('/recording')}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
    />
  );
}
