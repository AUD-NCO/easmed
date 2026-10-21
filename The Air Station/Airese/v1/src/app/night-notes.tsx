import { router, useLocalSearchParams } from 'expo-router';
import { useNights } from '../lib/recordings';
import { NightNotesScreen } from '../screens/NightNotesScreen';

/** ?night=<id>: that night's Night Notes, from its report. Otherwise Before sleeping, from Recording. */
export default function NightNotes() {
  const { night: id } = useLocalSearchParams<{ night?: string }>();
  const night = useNights().find((n) => n.id === id);
  return (
    <NightNotesScreen
      night={night}
      backLabel={night ? 'Back' : 'Recording'}
      onClose={() => (router.canGoBack() ? router.back() : router.replace(night ? '/reports' : '/home'))}
    />
  );
}
