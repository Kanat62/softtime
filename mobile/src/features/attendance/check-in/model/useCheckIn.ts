import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorCode, type CheckInResult, type CheckOutResult } from '@softtime/shared';
import { checkInApi, checkOutApi } from '@/entities/attendance/api/attendance';
import { queryKeys } from '@/shared/api/queryKeys';
import type { AppError } from '@/shared/api/errors';
import i18n from '@/shared/i18n';

export function mapScanError(err: AppError): string {
  if (err.isNetworkError) return i18n.t('errors:network');

  // Сначала машинный код — он не зависит от языка ответа бэкенда.
  switch (err.code) {
    case ErrorCode.SUBSCRIPTION_NOT_ACTIVE:
      return i18n.t('errors:checkIn.subscriptionSuspended');
    case ErrorCode.OUTSIDE_OFFICE_NETWORK:
      return i18n.t('errors:checkIn.outsideOfficeNetwork');
    case ErrorCode.NON_WORKING_DAY:
      return i18n.t('errors:checkIn.nonWorkingDay');
    case ErrorCode.QR_INVALID:
      return i18n.t('errors:checkIn.invalidQr');
    case ErrorCode.ALREADY_CHECKED_IN:
      return i18n.t('errors:checkIn.alreadyCheckedIn');
    case ErrorCode.NO_ACTIVE_CHECKIN:
      return i18n.t('errors:checkIn.checkInFirst');
    default:
      break;
  }

  // TODO: удалить после того, как бэкенд с кодами (A4.2) уедет в прод —
  // запасной путь для старого API, который ещё не присылает `code`.
  if (err.statusCode === 403) return i18n.t('errors:checkIn.subscriptionSuspended');
  if (err.statusCode === 400) {
    if (err.message.includes('сети') || err.message.toLowerCase().includes('network')) {
      return i18n.t('errors:checkIn.outsideOfficeNetwork');
    }
    if (err.message.includes('нерабочий')) return i18n.t('errors:checkIn.nonWorkingDay');
    if (err.message.includes('недействит') || err.message.toLowerCase().includes('invalid')) {
      return i18n.t('errors:checkIn.invalidQr');
    }
    return err.message;
  }
  if (err.statusCode === 409) {
    if (err.message.includes('уже')) return i18n.t('errors:checkIn.alreadyCheckedIn');
    if (err.message.includes('активного') || err.message.includes('active')) {
      return i18n.t('errors:checkIn.checkInFirst');
    }
    return err.message;
  }
  return err.message || i18n.t('errors:generic');
}

export function useAttendanceScan(mode: 'checkIn' | 'checkOut') {
  const queryClient = useQueryClient();

  return useMutation<CheckInResult | CheckOutResult, Error, string>({
    mutationFn: (qrToken: string) =>
      mode === 'checkIn'
        ? checkInApi({ qrToken })
        : (checkOutApi({ qrToken }) as Promise<CheckInResult | CheckOutResult>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.todayMe() });
    },
  });
}
