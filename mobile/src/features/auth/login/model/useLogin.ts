import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ErrorCode,
  loginSchema,
  type LoginDto,
  UserRole,
  type CompanyStatus,
} from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { loginApi, getMyCompanyApi } from '@/entities/user/api/auth';
import type { AppError } from '@/shared/api/errors';
import i18n from '@/shared/i18n';

function mapLoginError(err: AppError): string {
  if (err.isNetworkError) return i18n.t('errors:network');

  // Сначала машинный код — он не зависит от языка ответа бэкенда.
  switch (err.code) {
    case ErrorCode.TOO_MANY_ATTEMPTS:
      return i18n.t('errors:login.tooManyAttempts');
    case ErrorCode.INVALID_CREDENTIALS:
      return i18n.t('errors:login.badCredentials');
    // Сам /auth/login статус не проверяет (роут @Public), поэтому этот код
    // приходит только с защищённых запросов. Ветка оставлена защитно.
    case ErrorCode.ACCOUNT_BLOCKED:
      return i18n.t('errors:login.blocked');
    default:
      break;
  }

  // TODO: удалить после того, как бэкенд с кодами (A4.2) уедет в прод —
  // запасной путь для старого API, который ещё не присылает `code`.
  if (err.statusCode === 429) return i18n.t('errors:login.tooManyAttempts');
  if (err.statusCode === 401) return i18n.t('errors:login.badCredentials');
  if (err.statusCode === 403) {
    if (err.message.includes('блокир') || err.message.toLowerCase().includes('block')) {
      return i18n.t('errors:login.blocked');
    }
    return err.message;
  }
  return err.message || i18n.t('errors:generic');
}

export function useLogin() {
  const { setAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginDto) {
    setServerError(null);
    setIsLoading(true);

    try {
      const authResponse = await loginApi(data);

      let resolvedCompanyStatus: CompanyStatus | null = null;
      if (authResponse.user.role === UserRole.ADMIN) {
        try {
          const company = await getMyCompanyApi(authResponse.accessToken);
          resolvedCompanyStatus = company.status as CompanyStatus;
        } catch {
          // Company fetch failed — proceed; companyStatus will be null
        }
      }

      await setAuth({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        role: authResponse.user.role as UserRole,
        status: authResponse.user.status as any,
        companyStatus: resolvedCompanyStatus,
      });
      // RootNavigator's conditional rendering handles the navigation automatically.
    } catch (err) {
      setServerError(mapLoginError(err as AppError));
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
