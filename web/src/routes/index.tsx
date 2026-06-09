import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/session";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "PROVIDER") return <Navigate to="/provider/dashboard" />;
  return <Navigate to="/admin/dashboard" />;
}
