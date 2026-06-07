import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PendingStackParamList } from '@/shared/navigation/types';
import { PendingScreen } from '@/screens/auth/PendingScreen';

const Stack = createNativeStackNavigator<PendingStackParamList>();

export function PendingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pending" component={PendingScreen} />
    </Stack.Navigator>
  );
}
