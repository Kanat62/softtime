import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, Newspaper, FileText, User } from 'lucide-react-native';
import type {
  WorkerTabParamList,
  WorkerHomeStackParamList,
  NewsStackParamList,
  RequestsStackParamList,
  WorkerProfileStackParamList,
} from '@/shared/navigation/types';
import { colors, fontFamily, iconStrokeWidth, layout } from '@/shared/config/theme';

import { HomeScreen } from '@/screens/home/HomeScreen';
import { QrScannerScreen } from '@/screens/attendance/QrScannerScreen';
import { ScanResultScreen } from '@/screens/attendance/ScanResultScreen';
import { AttendanceHistoryScreen } from '@/screens/attendance/AttendanceHistoryScreen';
import { OfficeScreen } from '@/screens/office/OfficeScreen';
import { MyScheduleScreen } from '@/screens/schedule/MyScheduleScreen';
import { NewsFeedScreen } from '@/screens/news/NewsFeedScreen';
import { NewsDetailScreen } from '@/screens/news/NewsDetailScreen';
import { RequestsScreen } from '@/screens/requests/RequestsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

// ─── Nested Stacks ────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<WorkerHomeStackParamList>();

function WorkerHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="QrScanner" component={QrScannerScreen} />
      <HomeStack.Screen name="ScanResult" component={ScanResultScreen} />
      <HomeStack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <HomeStack.Screen name="Office" component={OfficeScreen} />
      <HomeStack.Screen name="MySchedule" component={MyScheduleScreen} />
      <HomeStack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </HomeStack.Navigator>
  );
}

const NewsStack = createNativeStackNavigator<NewsStackParamList>();

function WorkerNewsStack() {
  return (
    <NewsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <NewsStack.Screen name="NewsFeed" component={NewsFeedScreen} />
      <NewsStack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </NewsStack.Navigator>
  );
}

const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();

function WorkerRequestsStack() {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name="Requests" component={RequestsScreen} />
    </RequestsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<WorkerProfileStackParamList>();

function WorkerProfileStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<WorkerTabParamList>();

export function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = 24;
          const stroke = iconStrokeWidth;

          if (route.name === 'Home') return <House size={size} color={color} strokeWidth={stroke} />;
          if (route.name === 'News') return <Newspaper size={size} color={color} strokeWidth={stroke} />;
          if (route.name === 'Requests') return <FileText size={size} color={color} strokeWidth={stroke} />;
          if (route.name === 'Profile') return <User size={size} color={color} strokeWidth={stroke} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={WorkerHomeStack} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="News" component={WorkerNewsStack} options={{ tabBarLabel: 'Новости' }} />
      <Tab.Screen name="Requests" component={WorkerRequestsStack} options={{ tabBarLabel: 'Заявки' }} />
      <Tab.Screen name="Profile" component={WorkerProfileStack} options={{ tabBarLabel: 'Профиль' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: layout.tabBarHeight + (Platform.OS === 'ios' ? 0 : 8),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
});
