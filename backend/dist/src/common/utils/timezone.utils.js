"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalDayInfo = getLocalDayInfo;
exports.getLocalWeekday = getLocalWeekday;
exports.getLocalDateString = getLocalDateString;
const shared_1 = require("@softtime/shared");
const WEEKDAY_SHORT = {
    Sun: shared_1.Weekday.SUN,
    Mon: shared_1.Weekday.MON,
    Tue: shared_1.Weekday.TUE,
    Wed: shared_1.Weekday.WED,
    Thu: shared_1.Weekday.THU,
    Fri: shared_1.Weekday.FRI,
    Sat: shared_1.Weekday.SAT,
};
function getLocalDayInfo(utcDate, timezone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(utcDate);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '0';
    const hour = parseInt(get('hour'), 10) % 24;
    const minute = parseInt(get('minute'), 10);
    const second = parseInt(get('second'), 10);
    const localMs = (hour * 3600 + minute * 60 + second) * 1000 + utcDate.getMilliseconds();
    const startOfLocalDay = new Date(utcDate.getTime() - localMs);
    return {
        weekday: WEEKDAY_SHORT[get('weekday')] ?? shared_1.Weekday.MON,
        minutesInDay: hour * 60 + minute,
        startOfLocalDay,
    };
}
function getLocalWeekday(utcDate, timezone) {
    const weekdayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
    }).format(utcDate);
    return WEEKDAY_SHORT[weekdayStr] ?? shared_1.Weekday.MON;
}
function getLocalDateString(utcDate, timezone) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(utcDate);
}
//# sourceMappingURL=timezone.utils.js.map