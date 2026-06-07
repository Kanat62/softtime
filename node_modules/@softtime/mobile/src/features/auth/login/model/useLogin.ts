import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  type LoginDto,
  UserRole,
  UserStatus,
  CompanyStatus,
} from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';

type MockError = 'invalid_credentials' | 'blocked' | 'pending';

const MOCK_ERROR_MESSAGES: Record<MockError, string> = {
  invalid_credentials: 'Неверный email или пароль',
  blocked: 'Аккаунт заблокирован',
  pending: 'Ожидайте подтверждения администратора',
};

function getMockError(email: string): MockError | null {
  if (email === 'blocked@test.com') return 'blocked';
  if (email === 'pending@test.com') return 'pending';
  if (email !== 'worker@test.com') return 'invalid_credentials';
  return null;
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

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockError = getMockError(data.email);

    if (mockError) {
      setServerError(MOCK_ERROR_MESSAGES[mockError]);
      setIsLoading(false);
      return;
    }

    await setAuth({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      role: UserRole.WORKER,
      status: UserStatus.ACTIVE,
      companyStatus: CompanyStatus.ACTIVE,
    });

    setIsLoading(false);
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    serverError,
  };
}
