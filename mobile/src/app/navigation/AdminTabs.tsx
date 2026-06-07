import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, Newspaper, FileText, User } from 'lucide-react-native';
import type {
  AdminTabParamList,
  AdminHomeStackParamList,
  NewsStackParamList,
  RequestsStackParamList,
  AdminProfileStackParamList,
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
import { ManagementScreen } from '@/screens/management/ManagementScreen';
import { SubscriptionScreen } from '@/screens/subscription/SubscriptionScreen';
import { PaymentScreen } from '@/screens/subscription/PaymentScreen';
import { PaymentSuccessScreen } from '@/screens/subscription/PaymentSuccessScreen';

// ─── Nested Stacks ────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<AdminHomeStackParamList>();

function AdminHomeStack() {
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

function AdminNewsStack() {
  return (
    <NewsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <NewsStack.Screen name="NewsFeed" component={NewsFeedScreen} />
      <NewsStack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </NewsStack.Navigator>
  );
}

const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();

function AdminRequestsStack() {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name="Requests" component={RequestsScreen} />
    </RequestsStack.Navigator>
  );
}

// Profile tab — Management, Subscription, Payment accessible from here
const ProfileStack = createNativeStackNavigator<AdminProfileStackParamList>();

function AdminProfileStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Management" component={ManagementScreen} />
      <ProfileStack.Screen name="Subscription" component={SubscriptionScreen} />
      <ProfileStack.Screen name="Payment" component={PaymentScreen} />
      <ProfileStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => {
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
      <Tab.Screen name="Home" component={AdminHomeStack} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="News" component={AdminNewsStack} options={{ tabBarLabel: 'Новости' }} />
      <Tab.Screen name="Requests" component={AdminRequestsStack} options={{ tabBarLabel: 'Заявки' }} />
      <Tab.Screen name="Profile" component={AdminProfileStack} options={{ tabBarLabel: 'Профиль' }} />
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
