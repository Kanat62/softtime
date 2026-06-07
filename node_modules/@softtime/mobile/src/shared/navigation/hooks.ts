import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  WorkerHomeStackParamList,
  AdminHomeStackParamList,
  AdminProfileStackParamList,
  AuthStackParamList,
  NewsStackParamList,
} from './types';

export function useAuthNavigation() {
  return useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
}

export function useWorkerNavigation() {
  return useNavigation<NativeStackNavigationProp<WorkerHomeStackParamList>>();
}

export function useAdminNavigation() {
  return useNavigation<NativeStackNavigationProp<AdminHomeStackParamList>>();
}

export function useAdminProfileNavigation() {
  return useNavigation<NativeStackNavigationProp<AdminProfileStackParamList>>();
}

export function useNewsNavigation() {
  return useNavigation<NativeStackNavigationProp<NewsStackParamList>>();
}
