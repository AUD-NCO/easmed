import { router, useLocalSearchParams } from 'expo-router';
import { LegalScreen } from '../../screens/LegalScreen';

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  return <LegalScreen doc={doc === 'privacy' ? 'privacy' : 'terms'} onBack={() => (router.canGoBack() ? router.back() : router.replace('/details'))} />;
}
