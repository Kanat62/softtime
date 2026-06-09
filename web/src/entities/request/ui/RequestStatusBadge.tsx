import { StatusBadge } from "@/shared/ui/status-badge";
import type { RequestStatus } from "../model/types";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <StatusBadge status={status} />;
}
