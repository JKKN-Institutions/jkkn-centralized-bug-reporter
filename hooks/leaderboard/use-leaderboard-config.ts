'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeaderboardClientService } from '@/lib/services/leaderboard/client';
import type { LeaderboardConfig, UpdateLeaderboardConfigPayload } from '@bug-reporter/shared';
import toast from 'react-hot-toast';

/**
 * Hook to fetch and update leaderboard configuration
 */
export function useLeaderboardConfig(organizationId: string) {
  const [config, setConfig] = useState<LeaderboardConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!organizationId) {
      setConfig(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await LeaderboardClientService.getLeaderboardConfig(organizationId);
      setConfig(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch config';
      setError(message);
      console.error('[hooks/leaderboard-config] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(
    async (updates: Omit<UpdateLeaderboardConfigPayload, 'organization_id'>) => {
      if (!organizationId) return;

      try {
        setUpdating(true);

        const updated = await LeaderboardClientService.upsertLeaderboardConfig({
          organization_id: organizationId,
          ...updates,
        });

        setConfig(updated);

        toast.success('Leaderboard settings updated successfully');

        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update config';
        toast.error(message);
        console.error('[hooks/leaderboard-config] Update error:', err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [organizationId]
  );

  return {
    config,
    loading,
    error,
    updating,
    updateConfig,
    refetch: fetchConfig,
  };
}
