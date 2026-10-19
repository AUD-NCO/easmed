import { router } from 'expo-router';
import { SplashScreen } from '../screens/SplashScreen';

// App start: splash, then onboarding.
export default function Index() {
  return <SplashScreen onFinish={() => router.replace('/onboarding')} />;
}
