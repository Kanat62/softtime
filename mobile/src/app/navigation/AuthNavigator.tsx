import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/shared/navigation/types';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { RoleSelectScreen } from '@/screens/auth/RoleSelectScreen';
import { RegisterAdminScreen } from '@/screens/auth/RegisterAdminScreen';
import { RegisterWorkerScreen } from '@/screens/auth/RegisterWorkerScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="RegisterAdmin" component={RegisterAdminScreen} />
      <Stack.Screen name="RegisterWorker" component={RegisterWorkerScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
