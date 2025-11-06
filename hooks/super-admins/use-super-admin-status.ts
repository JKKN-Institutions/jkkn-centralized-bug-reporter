'use client';

import { useQuery } from '@tanstack/react-query';
import { checkIsSuperAdminAction } from '@/lib/actions/super-admins';

/**
 * Hook to check if current user is a super admin
 * Used for conditional UI rendering and access control
 */
export function useSuperAdminStatus() {
  return useQuery({
    queryKey: ['super-admin-status'],
    queryFn: async () => {
      const result = await checkIsSuperAdminAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? false;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - super admin status rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook variant that returns a boolean directly
 * Useful for simple conditional rendering
 */
export function useIsSuperAdmin(): boolean {
  const { data } = useSuperAdminStatus();
  return data ?? false;
}
