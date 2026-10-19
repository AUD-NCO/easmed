import { router } from 'expo-router';
import { AboutYouScreen } from '../screens/AboutYouScreen';

export default function AboutYou() {
  return <AboutYouScreen onDone={() => router.replace('/home')} />;
}
