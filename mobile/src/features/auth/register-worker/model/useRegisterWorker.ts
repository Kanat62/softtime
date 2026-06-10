import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWorkerSchema, type RegisterWorkerDto } from '@softtime/shared';
import { registerWorkerApi } from '@/entities/user/api/auth';
import type { AppError } from '@/shared/api/errors';

export function useRegisterWorker() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
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
      await registerWorkerApi(data);
      // After registration the user is PENDING.
      // We don't auto-login — the inline PendingView shows instead.
      setSubmittedEmail(data.email);
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
    submittedEmail,
    serverError,
  };
}
