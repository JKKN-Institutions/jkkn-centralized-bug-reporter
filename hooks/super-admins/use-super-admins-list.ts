'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSuperAdminsAction,
  addSuperAdminAction,
  removeSuperAdminAction,
} from '@/lib/actions/super-admins';
import type { CreateSuperAdminPayload } from '@/lib/services/super-admins/server';

/**
 * Hook to fetch and manage list of super admins
 * Only accessible by super admins
 */
export function useSuperAdminsList() {
  return useQuery({
    queryKey: ['super-admins'],
    queryFn: async () => {
      const result = await listSuperAdminsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a new super admin
 */
export function useAddSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSuperAdminPayload) => {
      const result = await addSuperAdminAction(payload);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate super admins list to refetch
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
    },
  });
}

/**
 * Hook to remove a super admin
 */
export function useRemoveSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (superAdminId: string) => {
      const result = await removeSuperAdminAction(superAdminId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      // Invalidate super admins list to refetch
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
    },
  });
}
