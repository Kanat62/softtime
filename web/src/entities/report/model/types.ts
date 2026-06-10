/** Matches backend ReportsService.ReportRow */
export interface ReportRow {
  userId: string;
  fullName: string;
  email: string;
  totalWorkedHours: number;
  lateCount: number;
  absentCount: number;
  approvedAbsenceCount: number;
  earliestCheckIn: string | null;
  latestCheckOut: string | null;
}

export interface ReportParams {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
  userId?: string;
}
