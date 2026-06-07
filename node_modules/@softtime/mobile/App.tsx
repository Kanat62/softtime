import React from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider, AuthProvider, FontsProvider } from '@/app/providers';
import { RootNavigator } from '@/app/navigation/RootNavigator';

Appearance.setColorScheme('light');

export default function App() {
  return (
    <FontsProvider>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="dark" backgroundColor="#F4F7FA" />
          <RootNavigator />
        </AuthProvider>
      </QueryProvider>
    </FontsProvider>
  );
}
