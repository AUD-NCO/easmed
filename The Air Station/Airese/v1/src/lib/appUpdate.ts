/**
 * App updates: opening the store page, so the user can update Airese.
 *
 * Whether to prompt is decided by the server: it compares the installed version with the
 * oldest supported one. Updates are forced for now (Oct 2026).
 * Not wired yet; the screen is reached from the demo nav.
 */
import { Linking, Platform } from 'react-native';

// TODO(engineering): the App Store ID, once the app is listed.
const APP_STORE_ID = '0000000000';
const ANDROID_PACKAGE = 'com.easmed.airese'; // app.json android.package

const STORE_URL = Platform.select({
  ios: `itms-apps://apps.apple.com/app/id${APP_STORE_ID}`,
  android: `market://details?id=${ANDROID_PACKAGE}`,
  default: `https://apps.apple.com/app/id${APP_STORE_ID}`,
});

/** Opens Airese in the App Store or Google Play. */
export function openStore() {
  return Linking.openURL(STORE_URL).catch(() => {});
}
