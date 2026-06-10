import { useQuery } from '@tanstack/react-query';
import { getSubscriptionApi, getPaymentsApi } from '@/entities/subscription/api/subscription';
import { queryKeys } from '@/shared/api/queryKeys';

export function useSubscription() {
  const subQuery = useQuery({
    queryKey: queryKeys.subscription.me(),
    queryFn: getSubscriptionApi,
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.list(0),
    queryFn: getPaymentsApi,
  });

  return {
    subscription: subQuery.data ?? null,
    isLoading: subQuery.isLoading,
    isError: subQuery.isError,
    refetch: subQuery.refetch,
    payments: paymentsQuery.data ?? [],
    paymentsLoading: paymentsQuery.isLoading,
  };
}
