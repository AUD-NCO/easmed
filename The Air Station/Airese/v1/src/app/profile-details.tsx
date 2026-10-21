import { router } from 'expo-router';
import { EditDetailsScreen } from '../screens/EditDetailsScreen';

/** Profile → Your details. */
export default function ProfileDetails() {
  return <EditDetailsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />;
}
