import { Test, TestingModule } from '@nestjs/testing';
import {
  CheckInStatus,
  CheckOutStatus,
  DayStatus,
} from '@softtime/shared';
import {
  calcCheckInStatus,
  calcCheckOutStatus,
  calcDayStatus,
  startOfDayUtc,
} from './attendance.service';
import { AttendanceCronService } from './attendance.cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Pure function tests ──────────────────────────────────────────────────────

describe('calcCheckInStatus', () => {
  it('returns ON_TIME when arrived exactly on time', () => {
    expect(calcCheckInStatus(480, 480)).toBe(CheckInStatus.ON_TIME);
  });

  it('returns ON_TIME when arrived 5 min late (boundary)', () => {
    expect(calcCheckInStatus(485, 480)).toBe(CheckInStatus.ON_TIME);
  });

  it('returns LATE when arrived 6 min late', () => {
    expect(calcCheckInStatus(486, 480)).toBe(CheckInStatus.LATE);
  });

  it('returns ON_TIME when arrived 5 min early (boundary)', () => {
    // diff = 475 - 480 = -5 → NOT < -5 → ON_TIME
    expect(calcCheckInStatus(475, 480)).toBe(CheckInStatus.ON_TIME);
  });

  it('returns EARLY_ARRIVAL when arrived 6 min early', () => {
    expect(calcCheckInStatus(474, 480)).toBe(CheckInStatus.EARLY_ARRIVAL);
  });

  it('returns LATE for large positive diff', () => {
    expect(calcCheckInStatus(600, 480)).toBe(CheckInStatus.LATE);
  });
});

describe('calcCheckOutStatus', () => {
  const END = 1020; // 17:00

  it('returns ON_TIME when left exactly on time', () => {
    expect(calcCheckOutStatus(END, END)).toBe(CheckOutStatus.ON_TIME);
  });

  it('returns ON_TIME when left 5 min late (boundary)', () => {
    expect(calcCheckOutStatus(END + 5, END)).toBe(CheckOutStatus.ON_TIME);
  });

  it('returns OVERTIME when left 6 min late', () => {
    expect(calcCheckOutStatus(END + 6, END)).toBe(CheckOutStatus.OVERTIME);
  });

  it('returns ON_TIME when left 5 min early (boundary)', () => {
    // diff = -5 → NOT < -5 → ON_TIME
    expect(calcCheckOutStatus(END - 5, END)).toBe(CheckOutStatus.ON_TIME);
  });

  it('returns LEFT_EARLY when left 6 min early', () => {
    expect(calcCheckOutStatus(END - 6, END)).toBe(CheckOutStatus.LEFT_EARLY);
  });
});

describe('calcDayStatus', () => {
  it('OVERTIME takes highest priority', () => {
    expect(calcDayStatus(CheckInStatus.LATE, CheckOutStatus.OVERTIME)).toBe(DayStatus.OVERTIME);
    expect(calcDayStatus(CheckInStatus.ON_TIME, CheckOutStatus.OVERTIME)).toBe(DayStatus.OVERTIME);
  });

  it('returns LATE when check-in late and check-out on time', () => {
    expect(calcDayStatus(CheckInStatus.LATE, CheckOutStatus.ON_TIME)).toBe(DayStatus.LATE);
  });

  it('returns EARLY_LEAVE when left early', () => {
    expect(calcDayStatus(CheckInStatus.ON_TIME, CheckOutStatus.LEFT_EARLY)).toBe(DayStatus.EARLY_LEAVE);
  });

  it('returns PRESENT when everything is normal', () => {
    expect(calcDayStatus(CheckInStatus.ON_TIME, CheckOutStatus.ON_TIME)).toBe(DayStatus.PRESENT);
    expect(calcDayStatus(CheckInStatus.EARLY_ARRIVAL, CheckOutStatus.ON_TIME)).toBe(DayStatus.PRESENT);
  });
});

describe('startOfDayUtc', () => {
  it('zeroes out time components preserving UTC date', () => {
    const d = new Date('2024-03-15T14:30:00.000Z');
    const sod = startOfDayUtc(d);
    expect(sod.toISOString()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('does not mutate input', () => {
    const d = new Date('2024-03-15T14:30:00Z');
    const original = d.getTime();
    startOfDayUtc(d);
    expect(d.getTime()).toBe(original);
  });
});

// ─── AttendanceCronService unit tests ────────────────────────────────────────

describe('AttendanceCronService.autoCloseShifts', () => {
  let service: AttendanceCronService;

  const mockPrisma = {
    company: { findMany: jest.fn() },
    attendance: {
      findMany: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    employeeSchedule: { findMany: jest.fn() },
    absenceRequest: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  };

  const mockNotifications = { sendToCompanyAdmins: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceCronService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AttendanceCronService>(AttendanceCronService);
    jest.clearAllMocks();
  });

  it('does nothing when no eligible companies', async () => {
    mockPrisma.company.findMany.mockResolvedValue([]);
    await service.autoCloseShifts();
    expect(mockPrisma.attendance.findMany).not.toHaveBeenCalled();
  });

  it('closes open shift past threshold and sends notification', async () => {
    // now = 2024-01-15T18:30:00Z (Monday, 18:30 UTC)
    jest.useFakeTimers().setSystemTime(new Date('2024-01-15T18:30:00.000Z'));

    const companyId = 'company-1';
    const userId = 'user-1';
    const attendanceId = 'att-1';

    mockPrisma.company.findMany.mockResolvedValue([{ id: companyId }]);
    mockPrisma.attendance.findMany.mockResolvedValue([
      {
        id: attendanceId,
        userId,
        companyId,
        date: new Date('2024-01-15T00:00:00.000Z'),
        checkInAt: new Date('2024-01-15T08:00:00.000Z'),
      },
    ]);
    // endTime=17:00, autoCheckoutBuffer=60 → threshold=18:00 < 18:30 → should close
    mockPrisma.employeeSchedule.findMany.mockResolvedValue([
      { userId, weekday: 'MON', endTime: '17:00', isWorkingDay: true, autoCheckoutBuffer: 60 },
    ]);
    mockPrisma.attendance.update.mockResolvedValue({});
    mockPrisma.user.findMany.mockResolvedValue([{ id: userId, fullName: 'Иван Иванов' }]);
    mockNotifications.sendToCompanyAdmins.mockResolvedValue(undefined);

    await service.autoCloseShifts();

    expect(mockPrisma.attendance.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkOutAt: new Date('2024-01-15T17:00:00.000Z'),
          status: DayStatus.INCOMPLETE,
          workedMinutes: 540, // 17:00 - 08:00 = 9 * 60
        }),
      }),
    );
    expect(mockNotifications.sendToCompanyAdmins).toHaveBeenCalledWith(
      companyId,
      'Незакрытые смены',
      expect.stringContaining('Иван Иванов'),
    );

    jest.useRealTimers();
  });

  it('skips shift that has not yet reached the threshold', async () => {
    // now = 2024-01-15T17:30:00Z — threshold is 18:00 → should NOT close
    jest.useFakeTimers().setSystemTime(new Date('2024-01-15T17:30:00.000Z'));

    mockPrisma.company.findMany.mockResolvedValue([{ id: 'company-1' }]);
    mockPrisma.attendance.findMany.mockResolvedValue([
      {
        id: 'att-1',
        userId: 'user-1',
        companyId: 'company-1',
        date: new Date('2024-01-15T00:00:00.000Z'),
        checkInAt: new Date('2024-01-15T08:00:00.000Z'),
      },
    ]);
    mockPrisma.employeeSchedule.findMany.mockResolvedValue([
      { userId: 'user-1', weekday: 'MON', endTime: '17:00', isWorkingDay: true, autoCheckoutBuffer: 60 },
    ]);

    await service.autoCloseShifts();

    expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    expect(mockNotifications.sendToCompanyAdmins).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
