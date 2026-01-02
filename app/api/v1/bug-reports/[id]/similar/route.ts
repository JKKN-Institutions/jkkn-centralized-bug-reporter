import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SimilarBug, SimilarBugsResult, GetSimilarBugsResponse } from '@boobalan_jkkn/shared';

// Similarity thresholds
const DUPLICATE_THRESHOLD = 0.9;
const RELATED_THRESHOLD = 0.7;
const MAX_RESULTS_PER_TIER = 3;

/**
 * GET /api/v1/bug-reports/[id]/similar
 * Get similar bugs for a given bug report
 *
 * Uses pgvector cosine similarity to find bugs with similar embeddings.
 * Returns two tiers:
 * - possibleDuplicates: similarity > 0.9
 * - relatedBugs: similarity 0.7-0.9
 *
 * Filters out dismissed suggestions from similarity_feedback table.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bugId } = await params;

    // Create Supabase client
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the target bug to get its embedding and organization
    const { data: targetBug, error: bugError } = await supabase
      .from('bug_reports')
      .select('id, embedding, organization_id')
      .eq('id', bugId)
      .single();

    if (bugError || !targetBug) {
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      );
    }

    // Check if the bug has an embedding
    if (!targetBug.embedding) {
      const response: GetSimilarBugsResponse = {
        bug_id: bugId,
        has_embedding: false,
        similar_bugs: {
          possibleDuplicates: [],
          relatedBugs: [],
        },
      };
      return NextResponse.json(response);
    }

    // Fetch dismissed suggestions to filter them out
    const { data: dismissedSuggestions } = await supabase
      .from('similarity_feedback')
      .select('suggested_bug_id')
      .eq('bug_report_id', bugId);

    const dismissedIds = new Set(dismissedSuggestions?.map((s: { suggested_bug_id: string }) => s.suggested_bug_id) || []);

    // Use the database function to find similar bugs
    const { data: similarBugs, error: similarError } = await supabase
      .rpc('find_similar_bugs', {
        target_bug_id: bugId,
        min_similarity: RELATED_THRESHOLD,
        max_results: (MAX_RESULTS_PER_TIER * 2) + dismissedIds.size, // Fetch extra to account for filtered
      });

    if (similarError) {
      console.error('[SimilarBugsAPI] Error finding similar bugs:', similarError);
      return NextResponse.json(
        { error: 'Failed to find similar bugs', details: similarError.message },
        { status: 500 }
      );
    }

    // Fetch application names for the similar bugs
    const bugIds = similarBugs?.map((b: any) => b.application_id) || [];
    const uniqueAppIds = [...new Set(bugIds)];

    let appNameMap: Record<string, string> = {};
    if (uniqueAppIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, name')
        .in('id', uniqueAppIds);

      if (apps) {
        appNameMap = apps.reduce((acc: Record<string, string>, app: { id: string; name: string }) => {
          acc[app.id] = app.name;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Filter out dismissed suggestions and transform to response format
    const filteredBugs: SimilarBug[] = (similarBugs || [])
      .filter((bug: any) => !dismissedIds.has(bug.bug_id))
      .map((bug: any) => ({
        id: bug.bug_id,
        display_id: bug.display_id,
        title: bug.title || '',
        description: bug.description || '',
        status: bug.status,
        application_id: bug.application_id,
        application_name: appNameMap[bug.application_id] || 'Unknown',
        similarity: bug.similarity,
        created_at: bug.created_at,
      }));

    // Split into tiers
    const possibleDuplicates = filteredBugs
      .filter(bug => bug.similarity >= DUPLICATE_THRESHOLD)
      .slice(0, MAX_RESULTS_PER_TIER);

    const relatedBugs = filteredBugs
      .filter(bug => bug.similarity >= RELATED_THRESHOLD && bug.similarity < DUPLICATE_THRESHOLD)
      .slice(0, MAX_RESULTS_PER_TIER);

    const result: SimilarBugsResult = {
      possibleDuplicates,
      relatedBugs,
    };

    const response: GetSimilarBugsResponse = {
      bug_id: bugId,
      has_embedding: true,
      similar_bugs: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SimilarBugsAPI] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
