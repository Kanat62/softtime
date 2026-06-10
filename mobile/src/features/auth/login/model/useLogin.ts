import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto, UserRole, type CompanyStatus } from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { loginApi, getMyCompanyApi } from '@/entities/user/api/auth';
import type { AppError } from '@/shared/api/errors';

function mapLoginError(err: AppError): string {
  if (err.isNetworkError) return 'Нет подключения к интернету';
  if (err.statusCode === 429) return 'Слишком много попыток. Повторите через 15 минут.';
  if (err.statusCode === 401) return 'Неверный email или пароль';
  if (err.statusCode === 403) {
    if (err.message.includes('блокир') || err.message.toLowerCase().includes('block')) {
      return 'Аккаунт заблокирован. Обратитесь к администратору.';
    }
    return err.message;
  }
  return err.message || 'Произошла ошибка. Попробуйте ещё раз.';
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
