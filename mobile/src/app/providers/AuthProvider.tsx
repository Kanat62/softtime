import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole, UserStatus, CompanyStatus } from '@softtime/shared';
import { tokenStorage } from '@/shared/storage/secure';
import { setupInterceptors } from '@/shared/api/interceptors';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { logoutApi } from '@/entities/user/api/auth';
import { getFCMToken } from '@/app/config/fcm';

interface AuthState {
  accessToken: string | null;
  userRole: UserRole | null;
  userStatus: UserStatus | null;
  companyStatus: CompanyStatus | null;
  isLoading: boolean;
  setAuth: (params: {
    accessToken: string;
    refreshToken: string;
    role: UserRole;
    status: UserStatus;
    companyStatus: CompanyStatus | null;
  }) => Promise<void>;
  updateCompanyStatus: (status: CompanyStatus) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setAccessToken(null);
    setUserRole(null);
    setUserStatus(null);
    setCompanyStatus(null);
  }, []);

  useEffect(() => {
    // Wire the 401-refresh interceptor's auth-failure callback.
    // When a silent refresh fails, the interceptor clears tokens and calls this,
    // which triggers the conditional rendering in RootNavigator to show Auth.
    setupInterceptors(async () => {
      await tokenStorage.clearTokens();
      clearAuthState();
    });

    // Optimistically restore the access token from SecureStore.
    // If the stored token is expired, the 401 interceptor handles it silently.
    tokenStorage.getAccessToken().then((storedToken) => {
      if (storedToken) {
        const payload = decodeJwtPayload(storedToken);
        if (payload) {
          setAccessToken(storedToken);
          setUserRole(payload.role as UserRole);
          setUserStatus(payload.status as UserStatus);
          // companyStatus is not in the JWT; stays null until fetched (Block 4/11)
        }
      }
      setIsLoading(false);
    });
  }, [clearAuthState]);

  async function setAuth(params: {
    accessToken: string;
    refreshToken: string;
    role: UserRole;
    status: UserStatus;
    companyStatus: CompanyStatus | null;
  }) {
    await tokenStorage.setTokens(params.accessToken, params.refreshToken);
    setAccessToken(params.accessToken);
    setUserRole(params.role);
    setUserStatus(params.status);
    setCompanyStatus(params.companyStatus);
    setIsLoading(false);
  }

  function updateCompanyStatus(status: CompanyStatus) {
    setCompanyStatus(status);
  }

  async function logout() {
    try {
      const fcmToken = await getFCMToken();
      await logoutApi(fcmToken ?? undefined);
    } catch {
      // Ignore backend errors on logout — always clear local state.
    }
    await tokenStorage.clearTokens();
    clearAuthState();
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userRole,
        userStatus,
        companyStatus,
        isLoading,
        setAuth,
        updateCompanyStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
