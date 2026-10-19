import { router } from 'expo-router';
import { eraseEverything } from '../lib/account';
import { ProfileScreen } from '../screens/ProfileScreen';

/** Opened from the avatar on Home. */
export default function Profile() {
  return (
    <ProfileScreen
      backLabel="Home"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      onOpenDetails={() => router.push('/profile-details')}
      onOpenCentres={() => router.push('/centres')}
      onErased={() => {
        eraseEverything();
        router.dismissAll();
        router.replace('/');
      }}
    />
  );
}
