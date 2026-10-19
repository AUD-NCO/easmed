import { Tabs } from 'expo-router';
import { TabBar, HOME_TABS } from '../../components';
import { colors } from '@ds/theme';

// Web / browser preview: the same two tabs with an iOS-style bar (native tabs only exist on iOS and Android).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={({ state, navigation }) => (
        <TabBar items={HOME_TABS} selected={state.routes[state.index].name} onSelect={(key) => navigation.navigate(key)} />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="reports" />
    </Tabs>
  );
}
