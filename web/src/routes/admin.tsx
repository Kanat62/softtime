import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/app/layouts";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
  ssr: false,
});

function AdminRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
