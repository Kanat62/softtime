import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProviderLayout } from "@/app/layouts";

export const Route = createFileRoute("/provider")({
  component: ProviderRoute,
  ssr: false,
});

function ProviderRoute() {
  return (
    <ProviderLayout>
      <Outlet />
    </ProviderLayout>
  );
}
