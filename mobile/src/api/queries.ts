import { queryOptions } from '@tanstack/react-query';

import { fetchResortCatalog, fetchResortConditions } from '@/api/client';

export const resortKeys = {
  all: ['resorts'] as const,
  detail: (resortId: string) => ['resorts', resortId, 'conditions'] as const,
};

export const resortCatalogQuery = (enabled = true) =>
  queryOptions({
    queryKey: resortKeys.all,
    queryFn: fetchResortCatalog,
    enabled,
    staleTime: 24 * 60 * 60_000,
  });

export const resortConditionsQuery = (resortId: string, enabled = true) =>
  queryOptions({
    queryKey: resortKeys.detail(resortId),
    queryFn: () => fetchResortConditions(resortId),
    enabled: enabled && resortId.length > 0,
    staleTime: 30 * 60_000,
    retry: 1,
  });
