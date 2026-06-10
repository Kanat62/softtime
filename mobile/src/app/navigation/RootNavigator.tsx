import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserStatus, UserRole } from '@softtime/shared';
import { useAuth } from '../providers/AuthProvider';
import type { RootParamList } from '@/shared/navigation/types';
import { navigationRef } from '@/shared/navigation/navigationRef';
import { linking } from './linking';
import { AuthNavigator } from './AuthNavigator';
import { PendingStack } from './PendingStack';
import { BlockedStack } from './BlockedStack';
import { WorkerTabs } from './WorkerTabs';
import { AdminTabs } from './AdminTabs';

const Stack = createNativeStackNavigator<RootParamList>();

export function RootNavigator() {
  const { accessToken, userStatus, userRole, isLoading } = useAuth();

  // Keep the loading blank while the stored token is read from SecureStore.
  // This is fast (<100ms) and avoids a flash of the wrong screen.
  if (isLoading) return null;

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {!accessToken ? (
          // No token → Auth flow (Splash → Onboarding → Login / Register)
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : userStatus === UserStatus.PENDING ? (
          // Registered but not yet approved by admin
          <Stack.Screen name="Pending" component={PendingStack} />
        ) : userStatus === UserStatus.BLOCKED ? (
          // Admin blocked this account
          <Stack.Screen name="Blocked" component={BlockedStack} />
        ) : userRole === UserRole.ADMIN ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : (
          <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
