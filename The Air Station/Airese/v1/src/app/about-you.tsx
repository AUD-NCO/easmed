import { router } from 'expo-router';
import { finishSetup } from '../lib/account';
import { AboutYouScreen } from '../screens/AboutYouScreen';

export default function AboutYou() {
  return (
    <AboutYouScreen
      onDone={() => {
        finishSetup();
        router.dismissAll();
        router.replace('/home');
      }}
    />
  );
}
