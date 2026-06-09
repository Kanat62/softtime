import { StatusBadge } from "@/shared/ui/status-badge";
import type { SubStatus } from "../model/types";

export function SubscriptionStatusBadge({ status }: { status: SubStatus }) {
  return <StatusBadge status={status} />;
}
