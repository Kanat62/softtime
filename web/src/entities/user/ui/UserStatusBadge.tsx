import { StatusBadge } from "@/shared/ui/status-badge";
import type { UserStatus } from "../model/types";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <StatusBadge status={status} />;
}
