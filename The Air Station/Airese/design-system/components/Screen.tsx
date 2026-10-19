import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, space, useInsets } from '../theme';

/** Every screen starts here: background, safe areas, edges, status bar. */
export function Screen({ children }: { children?: React.ReactNode }) {
  const insets = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.xl,
          paddingHorizontal: space.gutter,
        }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
