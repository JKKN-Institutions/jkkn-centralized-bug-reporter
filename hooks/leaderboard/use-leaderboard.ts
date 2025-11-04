'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeaderboardClientService } from '@/lib/services/leaderboard/client';
import type { LeaderboardEntry, LeaderboardTimePeriod } from '@bug-reporter/shared';

/**
 * Hook to fetch leaderboard entries for an organization
 */
export function useLeaderboard(organizationId: string, timePeriod: LeaderboardTimePeriod = 'all-time') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!organizationId) {
      setEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await LeaderboardClientService.getLeaderboard(
        organizationId,
        timePeriod
      );

      setEntries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(message);
      console.error('[hooks/leaderboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, timePeriod]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}

/**
 * Hook to fetch top 3 entries for podium display
 */
export function useTopThree(organizationId: string, timePeriod: LeaderboardTimePeriod = 'week') {
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopThree = useCallback(async () => {
    if (!organizationId) {
      setTopThree([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await LeaderboardClientService.getTopThree(organizationId, timePeriod);
      setTopThree(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch top three';
      setError(message);
      console.error('[hooks/top-three] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, timePeriod]);

  useEffect(() => {
    fetchTopThree();
  }, [fetchTopThree]);

  return {
    topThree,
    loading,
    error,
    refetch: fetchTopThree,
  };
}
