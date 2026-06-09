import { RequestType, RequestStatus } from "@softtime/shared";

export type { RequestType, RequestStatus };

/** Заявка сотрудника как возвращает API */
export interface AbsenceRequest {
  id: string;
  userId: string;
  type: RequestType;
  startDate: string;
  endDate: string | null;
  comment: string | null;
  status: RequestStatus;
  decisionNote: string | null;
  createdAt: string;
}
