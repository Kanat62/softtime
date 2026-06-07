import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWorkerSchema, type RegisterWorkerDto } from '@softtime/shared';

export function useRegisterWorker() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

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
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmittedEmail(data.email);
    setIsLoading(false);
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    submittedEmail,
  };
}
