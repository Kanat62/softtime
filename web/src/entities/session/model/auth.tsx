import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiClient } from "@/shared/api/client";
import { tokenStore } from "@/shared/api/tokenStore";
import { setupInterceptors } from "@/shared/api/interceptors";

// Register interceptors once at module load time
setupInterceptors();

// ─── Types ─────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "PROVIDER";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyCode?: string;
}

export interface RegisterData {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// ─── API response shapes ───────────────────────────────────────────────────

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
  companyCode: string;
}

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // On mount: attempt silent refresh to restore session from httpOnly cookie.
  // Uses apiClient (not a raw instance) so the dev mock can intercept it.
  // Safe: the 401 interceptor skips /auth/ URLs, preventing a redirect loop.
  useEffect(() => {
    apiClient
      .post<RefreshResponse>("/auth/refresh")
      .then(({ data }) => {
        tokenStore.set(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        tokenStore.set(null);
        setUser(null);
      })
      .finally(() => setHydrated(true));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
    tokenStore.set(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthUser> => {
    const res = await apiClient.post<RegisterResponse>("/auth/register/company", data);
    tokenStore.set(res.data.accessToken);
    // Merge companyCode into the user object so callers can access it
    const userWithCode: AuthUser = { ...res.data.user, companyCode: res.data.companyCode };
    setUser(userWithCode);
    return userWithCode;
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget; clear local session immediately (optimistic)
    apiClient.post("/auth/logout").catch(() => null);
    tokenStore.set(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    const { data } = await apiClient.post<RefreshResponse>("/auth/refresh");
    tokenStore.set(data.accessToken);
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout, refreshToken }}
    >
      {hydrated ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
