import { useQuery } from '@tanstack/react-query';
import { getCompanyMeApi } from '@/entities/company/api/company';
import { queryKeys } from '@/shared/api/queryKeys';

export function useCompany() {
  const query = useQuery({
    queryKey: queryKeys.company.me(),
    queryFn: getCompanyMeApi,
    staleTime: 10 * 60 * 1000,
  });

  return {
    company: query.data ?? null,
    isLoading: query.isLoading,
  };
}
