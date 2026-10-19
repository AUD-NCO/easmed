import { router, useLocalSearchParams } from 'expo-router';
import { NightNotesScreen } from '../screens/NightNotesScreen';

export default function NightNotes() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <NightNotesScreen backLabel={from === 'recording' ? 'Recording' : 'Home'} onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />;
}
