// ─── Analytics types ──────────────────────────────────────────────────────────

export interface DayOfWeekStats {
  weekday: string;
  attendanceRate: number;
  punctualityRate: number;
  sampleSize: number;
}

export interface WeekStats {
  weekLabel: string;
  attendanceRate: number;
  punctualityRate: number;
}

export type Trend = 'IMPROVING' | 'DECLINING' | 'STABLE';

export interface CompanyAggregates {
  periodFrom: string;
  periodTo: string;
  periodDays: number;
  employeeCount: number;

  totalScheduledRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;

  attendanceRate: number;
  punctualityRate: number;
  avgLateMinutes: number;

  worstWeekday: string | null;
  bestWeekday: string | null;
  dayBreakdown: DayOfWeekStats[];

  weeklyTrend: WeekStats[];
  attendanceTrend: Trend;
  punctualityTrend: Trend;
}

export type InsightResult =
  | { enough: false; reason: string }
  | { enough: true; aggregates: CompanyAggregates };

// ─── Stored insight ────────────────────────────────────────────────────────────

export interface StoredInsight {
  companyId: string;
  generatedAt: Date;
  insight: string;
  isEnough: boolean;
}
