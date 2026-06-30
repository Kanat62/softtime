import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckInResult, CheckOutResult } from '@softtime/shared';
import { checkInApi, checkOutApi } from '@/entities/attendance/api/attendance';
import { queryKeys } from '@/shared/api/queryKeys';
import type { AppError } from '@/shared/api/errors';

export function mapScanError(err: AppError): string {
  if (err.isNetworkError) return 'Нет подключения к интернету';
  if (err.statusCode === 403) return 'Подписка компании приостановлена';
  if (err.statusCode === 400) {
    if (err.message.includes('сети') || err.message.toLowerCase().includes('network')) {
      return 'Вы находитесь вне офисной сети';
    }
    if (err.message.includes('нерабочий')) return 'Сегодня нерабочий день по вашему графику';
    if (err.message.includes('недействит') || err.message.toLowerCase().includes('invalid')) {
      return 'QR-код недействителен или устарел';
    }
    return err.message;
  }
  if (err.statusCode === 409) {
    if (err.message.includes('уже')) return 'Приход уже был отмечен сегодня';
    if (err.message.includes('активного') || err.message.includes('active')) {
      return 'Сначала отметьте приход';
    }
    return err.message;
  }
  return err.message || 'Произошла ошибка. Попробуйте ещё раз.';
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
