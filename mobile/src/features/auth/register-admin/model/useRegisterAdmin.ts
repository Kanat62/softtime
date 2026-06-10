import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerCompanySchema, type RegisterCompanyDto } from '@softtime/shared';
import { registerCompanyApi, getMyCompanyApi } from '@/entities/user/api/auth';
import type { AppError } from '@/shared/api/errors';

export function useRegisterAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterCompanyDto>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: '',
      fullName: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: RegisterCompanyDto) {
    setServerError(null);
    setIsLoading(true);

    try {
      const authResponse = await registerCompanyApi(data);

      // The registration response doesn't include companyCode — fetch it separately
      // using the registration tokens (one-off call, we don't store these tokens).
      const company = await getMyCompanyApi(authResponse.accessToken);
      setCompanyCode(company.companyCode);
    } catch (err) {
      const appErr = err as AppError;
      if (appErr.isNetworkError) {
        setServerError('Нет подключения к интернету');
      } else if (appErr.statusCode === 409) {
        setServerError('Email уже используется. Войдите или используйте другой email.');
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
    companyCode,
    serverError,
  };
}
