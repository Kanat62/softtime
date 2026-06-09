import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth, type UserRole } from "@/entities/session";

/** Checks authentication only — redirects to /login if no session. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

/** @deprecated Use ProtectedRoute */
export function AuthGuard({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/**
 * Checks authentication + role.
 * - No session → /login
 * - Wrong role → own dashboard (/admin/dashboard or /provider/dashboard)
 */
export function RoleGuard({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user!.role !== role) {
    return <Navigate to={user!.role === "PROVIDER" ? "/provider/dashboard" : "/admin/dashboard"} />;
  }
  return <>{children}</>;
}
