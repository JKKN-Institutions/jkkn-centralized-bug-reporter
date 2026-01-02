'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  SimilarBug,
  SimilarBugsResult,
  GetSimilarBugsResponse,
  DismissSuggestionPayload,
  SuggestionType,
} from '@bug-reporter/shared';
import toast from 'react-hot-toast';

/**
 * Hook to fetch similar bugs for a given bug report
 * Uses the AI similarity detection API
 */
export function useSimilarBugs(bugId: string) {
  const [similarBugs, setSimilarBugs] = useState<SimilarBugsResult | null>(null);
  const [hasEmbedding, setHasEmbedding] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSimilarBugs = useCallback(async () => {
    if (!bugId) {
      setSimilarBugs(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/bug-reports/${bugId}/similar`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch similar bugs');
      }

      const data: GetSimilarBugsResponse = await response.json();

      setSimilarBugs(data.similar_bugs);
      setHasEmbedding(data.has_embedding);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch similar bugs';
      setError(message);
      console.error('[hooks/similar-bugs] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [bugId]);

  useEffect(() => {
    fetchSimilarBugs();
  }, [fetchSimilarBugs]);

  return {
    similarBugs,
    hasEmbedding,
    loading,
    error,
    refetch: fetchSimilarBugs,
  };
}

/**
 * Hook to dismiss a similar bug suggestion
 * Records feedback for implicit negative signal learning
 */
export function useDismissSuggestion() {
  const [dismissing, setDismissing] = useState(false);

  const dismissSuggestion = useCallback(async (
    bugId: string,
    suggestedBugId: string,
    similarityScore: number,
    suggestionType: SuggestionType
  ): Promise<boolean> => {
    try {
      setDismissing(true);

      const payload: DismissSuggestionPayload = {
        suggested_bug_id: suggestedBugId,
        similarity_score: similarityScore,
        suggestion_type: suggestionType,
      };

      const response = await fetch(`/api/v1/bug-reports/${bugId}/similar/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dismiss suggestion');
      }

      toast.success('Suggestion dismissed');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss suggestion';
      toast.error(message);
      console.error('[hooks/similar-bugs] Dismiss error:', err);
      return false;
    } finally {
      setDismissing(false);
    }
  }, []);

  return {
    dismissSuggestion,
    dismissing,
  };
}

/**
 * Combined hook for similar bugs with dismiss functionality
 */
export function useSimilarBugsWithDismiss(bugId: string) {
  const { similarBugs, hasEmbedding, loading, error, refetch } = useSimilarBugs(bugId);
  const { dismissSuggestion, dismissing } = useDismissSuggestion();

  const handleDismiss = useCallback(async (
    suggestedBug: SimilarBug,
    suggestionType: SuggestionType
  ) => {
    const success = await dismissSuggestion(
      bugId,
      suggestedBug.id,
      suggestedBug.similarity,
      suggestionType
    );

    if (success) {
      // Refetch to update the list
      refetch();
    }
  }, [bugId, dismissSuggestion, refetch]);

  return {
    similarBugs,
    hasEmbedding,
    loading,
    error,
    dismissing,
    handleDismiss,
    refetch,
  };
}
