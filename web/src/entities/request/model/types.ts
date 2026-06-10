import { RequestType, RequestStatus } from "@softtime/shared";

export type { RequestType, RequestStatus };

/** Заявка сотрудника как возвращает API */
export interface AbsenceRequest {
  id: string;
  userId: string;
  type: RequestType;
  startDate: string;
  endDate: string | null;
  /** Желаемое время ухода — только для EARLY_LEAVE */
  desiredTime: string | null;
  comment: string | null;
  status: RequestStatus;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
}
