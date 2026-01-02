import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DismissSuggestionPayload, DismissSuggestionResponse } from '@bug-reporter/shared';

/**
 * POST /api/v1/bug-reports/[id]/similar/dismiss
 * Dismiss a similar bug suggestion
 *
 * Records the dismissal in similarity_feedback table for:
 * 1. Filtering out the suggestion in future queries
 * 2. Implicit negative signal for threshold tuning
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bugId } = await params;

    // Parse request body
    const body: DismissSuggestionPayload = await request.json();

    // Validate required fields
    if (!body.suggested_bug_id || !body.suggestion_type || body.similarity_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: suggested_bug_id, suggestion_type, similarity_score' },
        { status: 400 }
      );
    }

    // Validate suggestion_type
    if (!['duplicate', 'related'].includes(body.suggestion_type)) {
      return NextResponse.json(
        { error: 'Invalid suggestion_type. Must be "duplicate" or "related"' },
        { status: 400 }
      );
    }

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

    // Fetch the target bug to get organization_id
    const { data: targetBug, error: bugError } = await supabase
      .from('bug_reports')
      .select('organization_id')
      .eq('id', bugId)
      .single();

    if (bugError || !targetBug) {
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      );
    }

    // Verify the suggested bug exists
    const { data: suggestedBug, error: suggestedError } = await supabase
      .from('bug_reports')
      .select('id')
      .eq('id', body.suggested_bug_id)
      .single();

    if (suggestedError || !suggestedBug) {
      return NextResponse.json(
        { error: 'Suggested bug not found' },
        { status: 404 }
      );
    }

    // Insert feedback record (upsert to handle duplicates)
    const { data: feedback, error: insertError } = await supabase
      .from('similarity_feedback')
      .upsert({
        bug_report_id: bugId,
        suggested_bug_id: body.suggested_bug_id,
        similarity_score: body.similarity_score,
        suggestion_type: body.suggestion_type,
        dismissed_by_user_id: user.id,
        organization_id: targetBug.organization_id,
        dismissed_at: new Date().toISOString(),
      }, {
        onConflict: 'bug_report_id,suggested_bug_id',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[DismissSuggestionAPI] Error inserting feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to record feedback', details: insertError.message },
        { status: 500 }
      );
    }

    const response: DismissSuggestionResponse = {
      success: true,
      feedback_id: feedback?.id || '',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[DismissSuggestionAPI] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
