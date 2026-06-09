import { Weekday } from '@softtime/shared';
export interface LocalDayInfo {
    weekday: Weekday;
    minutesInDay: number;
    startOfLocalDay: Date;
}
export declare function getLocalDayInfo(utcDate: Date, timezone: string): LocalDayInfo;
export declare function getLocalWeekday(utcDate: Date, timezone: string): Weekday;
export declare function getLocalDateString(utcDate: Date, timezone: string): string;
