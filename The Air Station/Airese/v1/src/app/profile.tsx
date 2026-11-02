import { router, useLocalSearchParams } from 'expo-router';
import { ProfileScreen, type ProfileSheet } from '../screens/ProfileScreen';

/** Opened from the avatar on Home. ?sheet=…: the demo nav opens one of its sheets. */
export default function Profile() {
  const { sheet } = useLocalSearchParams<{ sheet?: ProfileSheet }>();
  return (
    <ProfileScreen
      backLabel="Home"
      demoSheet={sheet}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      onOpenDetails={() => router.push('/profile-details')}
      onOpenCentres={() => router.push('/centres')}
      onOpenChangePassword={() => router.push('/change-password')}
      onLoggedOut={() => {
        if (router.canDismiss()) router.dismissAll();
        router.replace({ pathname: '/login', params: { out: '1' } });
      }}
      onAccountDeleted={() => {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
      }}
    />
  );
}
