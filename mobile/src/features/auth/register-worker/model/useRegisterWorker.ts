import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWorkerSchema, type RegisterWorkerDto, UserStatus, UserRole } from '@softtime/shared';
import { registerWorkerApi } from '@/entities/user/api/auth';
import { tokenStorage } from '@/shared/storage/secure';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { useAuth } from '@/app/providers/AuthProvider';
import type { AppError } from '@/shared/api/errors';

export function useRegisterWorker() {
  const { setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterWorkerDto>({
    resolver: zodResolver(registerWorkerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      companyCode: '',
    },
  });

  async function onSubmit(data: RegisterWorkerDto) {
    setServerError(null);
    setIsLoading(true);

    try {
      const tokens = await registerWorkerApi(data);
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

      const payload = decodeJwtPayload(tokens.accessToken);
      await setAuth({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: (payload?.role ?? UserRole.WORKER) as UserRole,
        status: UserStatus.PENDING,
        companyStatus: null,
      });
    } catch (err) {
      const appErr = err as AppError;
      if (appErr.isNetworkError) {
        setServerError('Нет подключения к интернету');
      } else if (appErr.statusCode === 404) {
        setServerError('Компания с таким кодом не найдена. Проверьте код.');
      } else if (appErr.statusCode === 409) {
        setServerError('Email уже зарегистрирован в этой компании.');
      } else {
        setServerError(appErr.message || 'Произошла ошибка. Попробуйте ещё раз.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    serverError,
  };
}
