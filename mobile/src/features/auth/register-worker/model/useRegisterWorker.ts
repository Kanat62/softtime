import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWorkerSchema, type RegisterWorkerDto, UserStatus, UserRole } from '@softtime/shared';
import { registerWorkerApi } from '@/entities/user/api/auth';
import { currentAppLanguage } from '@/entities/user/api/language';
import { tokenStorage } from '@/shared/storage/secure';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { useAuth } from '@/app/providers/AuthProvider';
import type { AppError } from '@/shared/api/errors';
import i18n from '@/shared/i18n';

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
      // Язык сразу в регистрацию: PENDING не сможет позвать
      // PATCH /users/me/language, а push о решении админа уже уйдёт ему.
      const tokens = await registerWorkerApi({
        ...data,
        language: currentAppLanguage(),
      });
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
        setServerError(i18n.t('errors:network'));
      } else if (appErr.statusCode === 404) {
        setServerError(i18n.t('errors:register.companyNotFound'));
      } else if (appErr.statusCode === 409) {
        setServerError(i18n.t('errors:register.emailTakenInCompany'));
      } else {
        setServerError(appErr.message || i18n.t('errors:generic'));
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
