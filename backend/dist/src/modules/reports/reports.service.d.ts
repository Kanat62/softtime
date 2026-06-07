import { PrismaService } from '../../prisma/prisma.service';
export interface ReportRow {
    userId: string;
    fullName: string;
    email: string;
    totalWorkedHours: number;
    lateCount: number;
    absentCount: number;
    approvedAbsenceCount: number;
    earliestCheckIn: Date | null;
    latestCheckOut: Date | null;
}
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    buildReport(query: {
        from: Date;
        to: Date;
        userId?: string;
    }): Promise<ReportRow[]>;
    buildCsv(query: {
        from: Date;
        to: Date;
        userId?: string;
    }): Promise<string>;
}
