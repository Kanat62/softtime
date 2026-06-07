import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BlockedStackParamList } from '@/shared/navigation/types';
import { BlockedScreen } from '@/screens/auth/BlockedScreen';

const Stack = createNativeStackNavigator<BlockedStackParamList>();

export function BlockedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Blocked" component={BlockedScreen} />
    </Stack.Navigator>
  );
}
