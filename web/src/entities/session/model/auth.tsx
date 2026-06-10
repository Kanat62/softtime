import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { UserRole, type User, type CompanyMe, type AuthResponse } from "@softtime/shared";
import { request } from "@/shared/api/request";
import { tokenStore } from "@/shared/api/tokenStore";
import { refreshTokenStore } from "@/shared/api/refreshTokenStore";
import { setupInterceptors } from "@/shared/api/interceptors";

// Register interceptors once at module load time
setupInterceptors();

// Re-export so existing imports `import { UserRole } from "@/entities/session"` keep working
export { UserRole };

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  logout: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ── On mount: attempt silent refresh to restore session ──────────────────────
  // Backend sends both tokens in the JSON body; we persist the refresh token in
  // sessionStorage so it survives page reloads within the same tab.
  useEffect(() => {
    const storedRefresh = refreshTokenStore.get();

    if (!storedRefresh) {
      setHydrated(true);
      return;
    }

    (async () => {
      try {
        // 1. Exchange refresh token for a new pair
        const tokens = await request<{ accessToken: string; refreshToken: string }>({
          method: "POST",
          url: "/auth/refresh",
          data: { refreshToken: storedRefresh },
        });
        tokenStore.set(tokens.accessToken);
        refreshTokenStore.set(tokens.refreshToken);

        // 2. Restore user profile (refresh response has no `user` field)
        const profile = await request<User>({ method: "GET", url: "/profile" });

        // 3. For ADMIN fetch company name + code for the sidebar / settings
        let companyName: string | undefined;
        let companyCode: string | undefined;
        if (profile.role === UserRole.ADMIN) {
          try {
            const company = await request<CompanyMe>({ method: "GET", url: "/companies/me" });
            companyName = company.name;
            companyCode = company.companyCode;
          } catch {
            // Non-fatal — displayed as empty in sidebar until Settings is opened
          }
        }

        setUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role as UserRole,
          companyId: profile.companyId ?? undefined,
          companyName,
          companyCode,
        });
      } catch {
        tokenStore.set(null);
        refreshTokenStore.clear();
        setUser(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await request<AuthResponse>({
      method: "POST",
      url: "/auth/login",
      data: { email, password },
    });

    tokenStore.set(res.accessToken);
    refreshTokenStore.set(res.refreshToken);

    // Fetch company details so the sidebar shows company name/code immediately
    let companyName: string | undefined;
    let companyCode: string | undefined;
    if (res.user.role === UserRole.ADMIN) {
      try {
        const company = await request<CompanyMe>({ method: "GET", url: "/companies/me" });
        companyName = company.name;
        companyCode = company.companyCode;
      } catch {}
    }

    const authUser: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.fullName,
      role: res.user.role as UserRole,
      companyId: res.user.companyId ?? undefined,
      companyName,
      companyCode,
    };
    setUser(authUser);
    return authUser;
  }, []);

  // ── Register company (ADMIN only) ─────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData): Promise<AuthUser> => {
    const res = await request<AuthResponse>({
      method: "POST",
      url: "/auth/register/company",
      data,
    });

    tokenStore.set(res.accessToken);
    refreshTokenStore.set(res.refreshToken);

    // Backend doesn't return companyCode in auth response — fetch it
    let companyName: string | undefined;
    let companyCode: string | undefined;
    try {
      const company = await request<CompanyMe>({ method: "GET", url: "/companies/me" });
      companyName = company.name;
      companyCode = company.companyCode;
    } catch {}

    const authUser: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.fullName,
      role: res.user.role as UserRole,
      companyId: res.user.companyId ?? undefined,
      companyName,
      companyCode,
    };
    setUser(authUser);
    return authUser;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await request({ method: "POST", url: "/auth/logout", data: {} });
    } catch {
      // Ignore — we always clear local state
    } finally {
      tokenStore.set(null);
      refreshTokenStore.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {hydrated ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
