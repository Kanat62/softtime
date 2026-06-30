import React from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider, AuthProvider, FontsProvider, NotificationProvider } from '@/app/providers';
import { RootNavigator } from '@/app/navigation/RootNavigator';

Appearance.setColorScheme('light');

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FontsProvider>
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <StatusBar style="dark" backgroundColor="#F4F7FA" />
              <RootNavigator />
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
      </FontsProvider>
    </GestureHandlerRootView>
  );
}
