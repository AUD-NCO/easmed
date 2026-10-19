import { Platform } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

declare global {
  var __AIRESE_PREVIEW_INSETS__: EdgeInsets | undefined;
}

/** iPhone 17 Pro: status bar + Dynamic Island on top, home indicator below. */
const IPHONE_17_PRO: EdgeInsets = { top: 62, bottom: 34, left: 0, right: 0 };

// Read once at start-up: in-app navigation changes the URL and would drop ?frame=iphone.
const IN_PHONE_FRAME = Platform.OS === 'web' && typeof window !== 'undefined' && (location.search.includes('frame=iphone') || insideIphoneHtml());

/** True when this page is loaded inside public/iphone.html (survives reloads on any route). */
function insideIphoneHtml() {
  try {
    return window.parent !== window && window.parent.location.pathname.endsWith('/iphone.html');
  } catch {
    return false; // different origin
  }
}

/**
 * Safe-area insets. In a browser there are none, so when the app runs inside
 * the iPhone frame (/iphone.html or the shared preview) we use the iPhone's.
 */
export function useInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    if (globalThis.__AIRESE_PREVIEW_INSETS__) return globalThis.__AIRESE_PREVIEW_INSETS__;
    if (IN_PHONE_FRAME) return IPHONE_17_PRO;
  }
  return insets;
}
