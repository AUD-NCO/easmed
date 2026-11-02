import { router } from 'expo-router';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';

/** Change password, from Profile → Account. Saving goes back to Profile, which confirms with a toast. */
export default function ChangePassword() {
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  return <ChangePasswordScreen onBack={back} onDone={back} />;
}
