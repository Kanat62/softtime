import React from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider, AuthProvider, FontsProvider, NotificationProvider } from '@/app/providers';
import { RootNavigator } from '@/app/navigation/RootNavigator';
// Инициализирует i18next (язык устройства, fallback ru). Провайдер не нужен:
// initReactI18next регистрирует инстанс по умолчанию для useTranslation.
import { restoreSavedLanguage } from '@/shared/i18n';

Appearance.setColorScheme('light');

export default function App() {
  // Применяет сохранённый выбор языка поверх языка устройства.
  React.useEffect(() => {
    void restoreSavedLanguage();
  }, []);

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
