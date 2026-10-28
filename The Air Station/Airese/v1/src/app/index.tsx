import { router } from 'expo-router';
import { startRoute } from '../lib/account';
import { SplashScreen } from '../screens/SplashScreen';

// App start: splash, then Home (logged in), Log in (logged out) or the walkthrough (first run).
export default function Index() {
  return (
    <SplashScreen
      onFinish={() => {
        const to = startRoute();
        router.replace(to === 'home' ? '/home' : to === 'login' ? { pathname: '/login', params: { out: '1' } } : '/onboarding');
      }}
    />
  );
}
