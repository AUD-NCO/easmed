import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '@ds/theme';

/**
 * Two tabs, Home and Reports, in the platform's own bottom tab bar (iOS tab bar / Android navigation bar).
 * Icons: SF Symbols on iOS, Material Symbols on Android. Web uses _layout.web.tsx.
 */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent} iconColor={colors.textMuted}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} md="description" />
        <NativeTabs.Trigger.Label>Reports</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
