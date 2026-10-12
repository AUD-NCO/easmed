import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemAlertHost } from '../components';
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Pages opened from a row (DetailPage): the system push on device; on web the page slides itself in. */
const PUSH =
  Platform.OS === 'web'
    ? ({ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } } as const)
    : ({ animation: 'slide_from_right' } as const);

export default function RootLayout() {
  const [loaded, error] = useFonts({ Montserrat_400Regular, Montserrat_600SemiBold, Inter_400Regular, Inter_600SemiBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {/* The splash's fall-away is the transition, so onboarding appears instantly */}
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        {/* Night Notes: a push (on web the page slides itself in over Home) */}
        <Stack.Screen name="night-notes" options={PUSH} />
        {/* Profile (from the avatar), and its pages one level deeper: the same push */}
        <Stack.Screen name="profile" options={PUSH} />
        <Stack.Screen name="profile-details" options={PUSH} />
        <Stack.Screen name="centres" options={PUSH} />
        {/* Terms and Privacy, from the agreement on the details screen */}
        <Stack.Screen name="legal/[doc]" options={PUSH} />
        {/* Recording can't start (no space, or the recorder failed) */}
        <Stack.Screen name="recording-problem" />
        {/* Update prompt: no swipe-back, so the update can't be dismissed */}
        <Stack.Screen name="update" options={{ gestureEnabled: false }} />
        {/* Recording draws its own entrance over Home (the button's blue fills the screen); no swipe-back mid-night */}
        <Stack.Screen name="recording" options={{ presentation: 'transparentModal', animation: 'none', gestureEnabled: false, contentStyle: { backgroundColor: 'transparent' } }} />
      </Stack>
      {/* Browser preview only: simulated system permission prompts (renders nothing on iOS/Android) */}
      <SystemAlertHost />
    </SafeAreaProvider>
  );
}
