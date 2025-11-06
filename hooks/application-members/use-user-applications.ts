'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserApplicationsAction } from '@/lib/actions/application-members';

/**
 * Hook to fetch applications that current user has access to
 * Returns array of application IDs
 */
export function useUserApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-applications', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      const result = await getUserApplicationsAction(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook variant that returns just the application IDs array
 */
export function useUserApplicationIds(userId: string | undefined): string[] {
  const { data } = useUserApplications(userId);
  return data ?? [];
}
