import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserStatus, UserRole } from '@softtime/shared';
import { useAuth } from '../providers/AuthProvider';
import type { RootParamList } from '@/shared/navigation/types';
import { AuthNavigator } from './AuthNavigator';
import { PendingStack } from './PendingStack';
import { BlockedStack } from './BlockedStack';
import { WorkerTabs } from './WorkerTabs';
import { AdminTabs } from './AdminTabs';

const Stack = createNativeStackNavigator<RootParamList>();

export function RootNavigator() {
  const { accessToken, userStatus, userRole, isLoading } = useAuth();

  if (isLoading) return null;

  function resolveInitial(): keyof RootParamList {
    if (!accessToken) return 'WorkerTabs'; // DEV: skip auth
    if (userStatus === UserStatus.PENDING) return 'Pending';
    if (userStatus === UserStatus.BLOCKED) return 'Blocked';
    if (userRole === UserRole.ADMIN) return 'AdminTabs';
    return 'WorkerTabs';
  }

  return (
    <NavigationContainer theme={DefaultTheme}>
      <Stack.Navigator
        initialRouteName={resolveInitial()}
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Pending" component={PendingStack} />
        <Stack.Screen name="Blocked" component={BlockedStack} />
        <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
