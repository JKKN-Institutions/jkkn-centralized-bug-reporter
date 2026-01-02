import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';

// Batch size for processing bugs
const BATCH_SIZE = 10;

// OpenAI embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * GET /api/cron/generate-embeddings
 * Cron job to generate embeddings for bug reports without embeddings
 *
 * This endpoint is called by Vercel Cron every minute.
 * It processes up to BATCH_SIZE bugs per invocation to stay within
 * execution time limits and API rate limits.
 *
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      console.error('[EmbeddingCron] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create Supabase admin client
    const supabase = createAdminClient();

    // Fetch bugs without embeddings
    const { data: bugs, error: fetchError } = await supabase
      .from('bug_reports')
      .select('id, description, metadata')
      .is('embedding', null)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('[EmbeddingCron] Error fetching bugs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bugs', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!bugs || bugs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bugs to process',
        processed: 0,
      });
    }

    console.log(`[EmbeddingCron] Processing ${bugs.length} bugs`);

    // Process each bug
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const bug of bugs) {
      try {
        // Extract title from metadata
        const title = bug.metadata?.title || '';
        const description = bug.description || '';

        // Combine title and description for embedding
        const textToEmbed = `${title}\n\n${description}`.trim();

        if (!textToEmbed) {
          console.warn(`[EmbeddingCron] Bug ${bug.id} has no text content, skipping`);
          continue;
        }

        // Generate embedding using OpenAI
        const embeddingResponse = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: textToEmbed,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Update bug with embedding
        // Note: pgvector expects the embedding as a string representation of an array
        const { error: updateError } = await supabase
          .from('bug_reports')
          .update({
            embedding: JSON.stringify(embedding),
            embedding_generated_at: new Date().toISOString(),
          })
          .eq('id', bug.id);

        if (updateError) {
          console.error(`[EmbeddingCron] Error updating bug ${bug.id}:`, updateError);
          results.failed++;
          results.errors.push(`Bug ${bug.id}: ${updateError.message}`);
        } else {
          results.processed++;
          console.log(`[EmbeddingCron] Generated embedding for bug ${bug.id}`);
        }
      } catch (embeddingError) {
        console.error(`[EmbeddingCron] Error processing bug ${bug.id}:`, embeddingError);
        results.failed++;
        results.errors.push(`Bug ${bug.id}: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
      }
    }

    console.log(`[EmbeddingCron] Completed: ${results.processed} processed, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} bugs, ${results.failed} failed`,
      ...results,
    });
  } catch (error) {
    console.error('[EmbeddingCron] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering during development
export async function POST(request: NextRequest) {
  return GET(request);
}
