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
import type { Dictionary, ErrorMessages, PushMessages } from './ru';

/**
 * См. ru.ts — тот же набор ключей, та же аннотация, тот же порядок.
 * Пропущенный код ловится компилятором.
 */
const errors: ErrorMessages = {
  // ─── HTTP status fallbacks ──────────────────────────────────────────────
  VALIDATION_ERROR: 'Please check the highlighted fields',
  BAD_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Not found',
  CONFLICT: 'Conflicts with existing data',
  UNPROCESSABLE_ENTITY: 'The data could not be processed',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  INTERNAL_ERROR: 'Internal server error',

  // ─── Access (guards) ────────────────────────────────────────────────────
  FORBIDDEN_ROLE: 'Insufficient permissions',
  SUBSCRIPTION_NOT_ACTIVE: 'The company subscription is not active',
  ACCOUNT_BLOCKED: 'Account is blocked',
  ACCOUNT_PENDING: 'Awaiting administrator approval',
  ACCOUNT_DELETED: 'Account deleted',

  // ─── Authentication ─────────────────────────────────────────────────────
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again in 15 minutes.',
  EMAIL_TAKEN: 'This email is already registered',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
  REFRESH_TOKEN_EXPIRED: 'Refresh token not found or expired',

  // ─── Attendance / QR ────────────────────────────────────────────────────
  QR_INVALID: 'Invalid QR code',
  QR_NOT_FOUND: 'No active QR code found. Use /qr/regenerate.',
  OUTSIDE_OFFICE_NETWORK: 'Outside the office network',
  NON_WORKING_DAY: 'Today is a non-working day',
  ALREADY_CHECKED_IN: 'Check in is already recorded',
  NO_ACTIVE_CHECKIN: 'No active check in to check out from',
  SCHEDULE_NOT_CONFIGURED: 'No schedule is set for today',
  ATTENDANCE_NOT_FOUND: 'Attendance record not found',
  ATTENDANCE_ALREADY_EXISTS: 'An attendance record for this day already exists',

  // ─── Users ──────────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'User not found',
  USER_NOT_PENDING: 'User is not in PENDING status',
  CANNOT_CHANGE_OWN_STATUS: 'You cannot change your own status',
  CANNOT_DELETE_OWN_ACCOUNT: 'You cannot delete your own account',
  INVALID_USER_STATUS: 'Allowed statuses: ACTIVE, BLOCKED, WARNING',
  CURRENT_PASSWORD_REQUIRED: 'currentPassword is required to change the password',
  CURRENT_PASSWORD_INVALID: 'Current password is incorrect',
  NO_FIELDS_TO_UPDATE: 'No data to update',
  LAST_ADMIN_CANNOT_DELETE:
    'You are the only administrator of the company, so you cannot delete your account. Please contact support.',

  // ─── Companies ──────────────────────────────────────────────────────────
  COMPANY_NOT_FOUND: 'Company not found',

  // ─── Requests ───────────────────────────────────────────────────────────
  REQUEST_NOT_FOUND: 'Request not found',
  REQUEST_ALREADY_HANDLED: 'This request has already been handled',
  REQUEST_INVALID_DATE_RANGE: 'endDate cannot be earlier than startDate',

  /** Параметры приходят в `params` — см. комментарий в ru.ts. */
  SCHEDULE_MIN_HOURS:
    '{{weekday}}: a working day must be at least {{hours}} h ({{startTime}}–{{endTime}})',

  // ─── Subscriptions ──────────────────────────────────────────────────────
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  SUBSCRIPTION_CANCELLED: 'The subscription was cancelled. Please contact support.',
  SUBSCRIPTION_ALREADY_CANCELLED: 'The subscription is already cancelled',

  // ─── Office networks ────────────────────────────────────────────────────
  OFFICE_NETWORK_NOT_FOUND: 'Network not found',

  // ─── News ───────────────────────────────────────────────────────────────
  NEWS_NOT_FOUND: 'News item not found',

  // ─── Payments / reports ─────────────────────────────────────────────────
  PAYMENT_NOT_FOUND: 'Payment not found',
};

/** См. ru.ts — тот же перечень событий, тот же порядок. */
const push: PushMessages = {
  newEmployee: {
    title: 'New employee',
    body: '{{fullName}} is waiting for registration approval',
  },
  newCompany: {
    title: 'New company',
    body: 'Company “{{companyName}}” has registered on the platform',
  },
  registrationApproved: {
    title: 'Registration approved',
    body: 'Your registration with the company has been approved',
  },
  registrationRejected: {
    title: 'Registration rejected',
    body: 'Your registration request has been rejected',
  },

  newRequest: {
    title: 'New request',
    body: 'Request submitted: {{requestType}} from {{fullName}}',
  },
  requestApproved: {
    title: 'Request approved',
    body: 'Your “{{requestType}}” request has been approved',
  },
  requestRejected: {
    title: 'Request rejected',
    body: 'Your “{{requestType}}” request has been rejected',
  },
  requestRejectedWithReason: {
    title: 'Request rejected',
    body: 'Your “{{requestType}}” request has been rejected: {{reason}}',
  },

  newsPublished: {
    title: 'New post',
    body: '{{newsTitle}}',
  },

  companySuspended: {
    title: 'Company suspended',
    body: 'Your company has been suspended by the platform administrator.',
  },
  subscriptionCancelled: {
    title: 'Subscription cancelled',
    body: 'Your subscription has been cancelled. Access to the system is suspended.',
  },
  paymentReceived: {
    title: 'Payment received',
    body: 'Payment received from company “{{companyName}}”',
  },

  companySuspendedUnpaid: {
    title: 'Company suspended',
    body: 'The subscription has not been paid. Access to the system is suspended.',
  },
  subscriptionExpiring: {
    title: 'Subscription expiring',
    body_one: 'Pay the subscription within {{count}} day, otherwise access will be suspended.',
    body_few: 'Pay the subscription within {{count}} days, otherwise access will be suspended.',
    body_many: 'Pay the subscription within {{count}} days, otherwise access will be suspended.',
    body_other: 'Pay the subscription within {{count}} days, otherwise access will be suspended.',
  },
  unclosedShifts: {
    title: 'Unclosed shifts',
    body_one: 'An employee did not check out: {{names}}',
    body_few: 'Employees did not check out: {{names}}',
    body_many: 'Employees did not check out: {{names}}',
    body_other: 'Employees did not check out: {{names}}',
  },
};

export const en: Dictionary = {
  errors,
  push,

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
