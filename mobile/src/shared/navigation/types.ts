import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ─── Auth Stack ──────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  RoleSelect: undefined;
  RegisterAdmin: undefined;
  RegisterWorker: undefined;
  Login: undefined;
};

// ─── Guard Stacks ────────────────────────────────────────────────────────────

export type PendingStackParamList = {
  Pending: undefined;
};

export type BlockedStackParamList = {
  Blocked: undefined;
};

// ─── Worker Home Stack (nested under Home tab) ───────────────────────────────

export type WorkerHomeStackParamList = {
  HomeScreen: undefined;
  QrScanner: { mode: 'checkIn' | 'checkOut' };
  ScanResult: {
    type: 'checkIn' | 'checkOut';
    status: string;
    time: string;
    message: string;
    diffMinutes?: number;
    workedMinutes?: number;
    dayStatus?: string;
  };
  AttendanceHistory: undefined;
  Office: undefined;
  MySchedule: undefined;
  NewsDetail: { id: string };
};

// ─── Worker News Stack ───────────────────────────────────────────────────────

export type NewsStackParamList = {
  NewsFeed: undefined;
  NewsDetail: { id: string };
};

// ─── Requests Stack ──────────────────────────────────────────────────────────

export type RequestsStackParamList = {
  Requests: undefined;
};

// ─── Worker Profile Stack ────────────────────────────────────────────────────

export type WorkerProfileStackParamList = {
  Profile: undefined;
};

// ─── Worker Tabs ─────────────────────────────────────────────────────────────

export type WorkerTabParamList = {
  Home: undefined;
  News: undefined;
  Requests: undefined;
  Profile: undefined;
};

// ─── Admin Home Stack ────────────────────────────────────────────────────────

export type AdminHomeStackParamList = {
  HomeScreen: undefined;
  QrScanner: { mode: 'checkIn' | 'checkOut' };
  ScanResult: {
    type: 'checkIn' | 'checkOut';
    status: string;
    time: string;
    message: string;
    diffMinutes?: number;
    workedMinutes?: number;
    dayStatus?: string;
  };
  AttendanceHistory: undefined;
  Office: undefined;
  MySchedule: undefined;
  NewsDetail: { id: string };
};

// ─── Admin Profile Stack (Management accessible from Profile tab) ────────────

export type AdminProfileStackParamList = {
  Profile: undefined;
  Management: undefined;
  Subscription: undefined;
  Payment: undefined;
  PaymentSuccess: undefined;
};

// ─── Admin Tabs ──────────────────────────────────────────────────────────────

export type AdminTabParamList = {
  Home: undefined;
  News: undefined;
  Requests: undefined;
  Profile: undefined;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export type RootParamList = {
  Auth: undefined;
  Pending: undefined;
  Blocked: undefined;
  WorkerTabs: undefined;
  AdminTabs: undefined;
};

// ─── Screen Props helpers ─────────────────────────────────────────────────────

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type WorkerTabScreenProps<T extends keyof WorkerTabParamList> =
  BottomTabScreenProps<WorkerTabParamList, T>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  BottomTabScreenProps<AdminTabParamList, T>;

export type WorkerHomeScreenProps<T extends keyof WorkerHomeStackParamList> =
  NativeStackScreenProps<WorkerHomeStackParamList, T>;

export type AdminHomeScreenProps<T extends keyof AdminHomeStackParamList> =
  NativeStackScreenProps<AdminHomeStackParamList, T>;

export type AdminProfileScreenProps<T extends keyof AdminProfileStackParamList> =
  NativeStackScreenProps<AdminProfileStackParamList, T>;
