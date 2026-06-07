import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerCompanySchema, type RegisterCompanyDto } from '@softtime/shared';

function generateMockCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useRegisterAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [companyCode, setCompanyCode] = useState<string | null>(null);

  const form = useForm<RegisterCompanyDto>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: '',
      fullName: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(_data: RegisterCompanyDto) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCompanyCode(generateMockCode());
    setIsLoading(false);
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    companyCode,
  };
}
