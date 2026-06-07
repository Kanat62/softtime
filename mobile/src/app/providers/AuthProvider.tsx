import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserStatus, CompanyStatus } from '@softtime/shared';
import { tokenStorage } from '@/shared/storage/secure';

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
    companyStatus: CompanyStatus;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tokenStorage.getAccessToken().then((token) => {
      setAccessToken(token);
      setIsLoading(false);
    });
  }, []);

  async function setAuth(params: {
    accessToken: string;
    refreshToken: string;
    role: UserRole;
    status: UserStatus;
    companyStatus: CompanyStatus;
  }) {
    await tokenStorage.setTokens(params.accessToken, params.refreshToken);
    setAccessToken(params.accessToken);
    setUserRole(params.role);
    setUserStatus(params.status);
    setCompanyStatus(params.companyStatus);
  }

  async function logout() {
    await tokenStorage.clear();
    setAccessToken(null);
    setUserRole(null);
    setUserStatus(null);
    setCompanyStatus(null);
  }

  return (
    <AuthContext.Provider
      value={{ accessToken, userRole, userStatus, companyStatus, isLoading, setAuth, logout }}
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
