// App entry.
// Normal runs (iOS, Android, web) use expo-router.
// `npm run preview` sets EXPO_PUBLIC_PREVIEW=1 to build the browser preview
// that is shown inside an iPhone frame (see /preview and /scripts).
if (process.env.EXPO_PUBLIC_PREVIEW === '1') {
  require('./preview');
} else {
  require('expo-router/entry');
}
