import { router } from 'expo-router';
import { DetailsScreen } from '../screens/DetailsScreen';

/** Your details: set-up, after the permissions. */
export default function Details() {
  return <DetailsScreen onDone={() => router.push('/about-you')} />;
}
