import { Platform } from 'react-native';
import { type } from '@ds/theme';

/**
 * V1 only (Oct 2026): page titles (H1) a little smaller and bolder, 28 bold in place of 32 semibold.
 * Every V1 title takes it (Home, Reports, pushed pages); the shared token, and V2, stay as they are.
 * Imported once, first thing, from the root layout. Montserrat Bold is loaded there.
 */
Object.assign(type.title, {
  fontSize: 28,
  lineHeight: 36,
  ...(Platform.OS === 'web'
    ? { fontFamily: 'Montserrat_700Bold, Montserrat, system-ui, sans-serif', fontWeight: '700' }
    : { fontFamily: 'Montserrat_700Bold' }),
});
