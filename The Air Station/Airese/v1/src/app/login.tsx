import { router, useLocalSearchParams } from 'expo-router';
import { LoginScreen } from '../screens/LoginScreen';

/** Log in: from the walkthrough's I already have an account (with a back), or after logging out (?out=1, no back). */
export default function Login() {
  const { out } = useLocalSearchParams<{ out?: string }>();
  return (
    <LoginScreen
      onBack={out ? undefined : () => (router.canGoBack() ? router.back() : router.replace('/onboarding'))}
      onLoggedIn={() => {
        router.dismissAll();
        router.replace('/home');
      }}
      onForgot={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onSignUp={() => router.replace('/register')}
    />
  );
}
