import { router, useLocalSearchParams } from 'expo-router';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

/** Forgot password, from Log in. ?state=new: the demo nav's new-password step. */
export default function ForgotPassword() {
  const { email, state } = useLocalSearchParams<{ email?: string; state?: string }>();
  return (
    <ForgotPasswordScreen
      email={email}
      demo={state === 'new'}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      onDone={() => {
        router.dismissAll();
        router.replace('/home');
      }}
    />
  );
}
