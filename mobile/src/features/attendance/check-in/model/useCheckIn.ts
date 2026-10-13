import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckInResult, CheckOutResult } from '@softtime/shared';
import { checkInApi, checkOutApi } from '@/entities/attendance/api/attendance';
import { queryKeys } from '@/shared/api/queryKeys';
import type { AppError } from '@/shared/api/errors';
import i18n from '@/shared/i18n';

export function mapScanError(err: AppError): string {
  if (err.isNetworkError) return i18n.t('errors:network');
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
