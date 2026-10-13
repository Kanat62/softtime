/**
 * Английский общий словарь.
 *
 * Тип `Dictionary` берётся из ru.ts, поэтому пропуск или опечатка
 * в ключе ловится компилятором (`npx tsc --noEmit`).
 *
 * Терминология по глоссарию из docs/PLAN_i18n.md:
 * Check in / Check out · Requests · Attendance · Employee · Schedule ·
 * Subscription · Free trial · Grace period · Suspended.
 */
import type { Dictionary } from './ru';

export const en: Dictionary = {
  enums: {
    userRole: {
      PROVIDER: 'Provider',
      ADMIN: 'Administrator',
      WORKER: 'Employee',
    },

    userStatus: {
      PENDING: 'Pending approval',
      ACTIVE: 'Active',
      WARNING: 'Warning',
      BLOCKED: 'Blocked',
      DELETED: 'Deleted',
    },

    companyStatus: {
      TRIAL: 'Free trial',
      ACTIVE: 'Active',
      GRACE: 'Grace period',
      SUSPENDED: 'Suspended',
    },

    subStatus: {
      TRIAL: 'Free trial',
      ACTIVE: 'Active',
      EXPIRED: 'Expired',
      GRACE: 'Grace period',
      CANCELLED: 'Cancelled',
    },

    checkInStatus: {
      ON_TIME: 'On time',
      LATE: 'Late',
      EARLY_ARRIVAL: 'Early arrival',
    },

    checkOutStatus: {
      ON_TIME: 'On time',
      LEFT_EARLY: 'Left early',
      OVERTIME: 'Overtime',
    },

    dayStatus: {
      PRESENT: 'Present',
      LATE: 'Late',
      ABSENT: 'Absent',
      INCOMPLETE: 'Incomplete',
      APPROVED_ABSENCE: 'Approved absence',
      MANUAL: 'Manual entry',
      EARLY_LEAVE: 'Early leave',
      OVERTIME: 'Overtime',
    },

    requestType: {
      SICK: 'Sick leave',
      FAMILY: 'Family reasons',
      VACATION: 'Vacation',
      BUSINESS_TRIP: 'Business trip',
      REMOTE: 'Remote work',
      LATE_REASON: 'Late arrival (with reason)',
      EARLY_LEAVE: 'Early leave (with reason)',
      OTHER: 'Other',
    },

    requestStatus: {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    },

    paymentStatus: {
      PENDING: 'Awaiting payment',
      PAID: 'Paid',
      FAILED: 'Payment failed',
    },

    weekdayShort: {
      MON: 'Mon',
      TUE: 'Tue',
      WED: 'Wed',
      THU: 'Thu',
      FRI: 'Fri',
      SAT: 'Sat',
      SUN: 'Sun',
    },

    weekdayLong: {
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
      SUN: 'Sunday',
    },
  },

  validation: {
    required: {
      companyName: 'Company name is required',
      fullName: 'Full name is required',
      password: 'Password is required',
      currentPassword: 'Enter your current password',
      label: 'Name is required',
      qrToken: 'qrToken is required',
      refreshToken: 'refreshToken is required',
      fcmToken: 'fcmToken is required',
    },

    format: {
      email: 'Invalid email address',
      url: 'Invalid URL',
      userUuid: 'Invalid user UUID',
      date: 'Date format: YYYY-MM-DD',
      time: 'Time format: HH:mm',
      startDate: 'Invalid start date',
      companyCode: 'Company code must be exactly 6 digits',
      cidr: 'Invalid CIDR or IP (example: 192.168.1.0/24)',
    },

    password: {
      min: 'Password must be at least 8 characters',
      max: 'Password must not exceed 72 characters',
      currentRequired: 'currentPassword is required when changing the password',
    },

    length: {
      noteMax500: 'Note must not exceed 500 characters',
      commentMax500: 'Comment must not exceed 500 characters',
      commentMax1000: 'Comment must not exceed 1000 characters',
      labelMax100: 'Name must not exceed 100 characters',
    },

    update: {
      noData: 'No data to update',
      atLeastOneFieldToUpdate: 'Specify at least one field to update',
      atLeastOneField: 'Specify at least one field',
    },

    enumValue: {
      dayStatus: 'Invalid day status',
      requestType: 'Invalid request type',
      userStatus: 'Allowed statuses: ACTIVE, BLOCKED, WARNING',
    },

    schedule: {
      startRequired: 'Shift start time is required for a working day',
      endRequired: 'Shift end time is required for a working day',
      minHours: 'A working day must be at least 6 hours',
      sevenDays: 'The schedule must contain exactly 7 days',
    },

    settings: {
      integer: 'Must be a whole number',
      minHours: 'Minimum 1 hour',
      maxHours: 'Maximum 24 hours',
      notNegative: 'Cannot be negative',
      maxMinutes: 'Maximum 480 minutes',
    },

    assistant: {
      questionMin: 'Question is too short (minimum 3 characters)',
      questionMax: 'Question is too long (maximum 300 characters)',
    },
  },
};
