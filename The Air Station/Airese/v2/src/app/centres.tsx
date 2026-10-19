import { router } from 'expo-router';
import { CentresScreen } from '../screens/CentresScreen';

export default function Centres() {
  return <CentresScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />;
}
