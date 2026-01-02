'use client';

import { X, Link2, Sparkles, AlertTriangle, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSimilarBugsWithDismiss } from '@/hooks/bug-reports/use-similar-bugs';
import type { SimilarBug, SuggestionType } from '@boobalan_jkkn/shared';
import { BugStatusBadge } from '../../_components/bug-status-badge';

interface SimilarBugsCardProps {
  bugId: string;
  organizationSlug: string;
}

interface SimilarBugItemProps {
  bug: SimilarBug;
  suggestionType: SuggestionType;
  organizationSlug: string;
  onDismiss: (bug: SimilarBug, type: SuggestionType) => void;
  dismissing: boolean;
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const percentage = Math.round(similarity * 100);
  const variant = similarity >= 0.9 ? 'destructive' : 'secondary';

  return (
    <Badge variant={variant} className="text-xs font-mono">
      {percentage}% match
    </Badge>
  );
}

function SimilarBugItem({
  bug,
  suggestionType,
  organizationSlug,
  onDismiss,
  dismissing,
}: SimilarBugItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/org/${organizationSlug}/bugs/${bug.id}`}
            className="font-medium text-sm hover:underline truncate"
          >
            {bug.title || 'Untitled Bug'}
          </Link>
          <SimilarityBadge similarity={bug.similarity} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{bug.display_id}</span>
          <span className="text-muted-foreground/50">|</span>
          <span>{bug.application_name}</span>
          <span className="text-muted-foreground/50">|</span>
          <BugStatusBadge status={bug.status} />
        </div>
        {bug.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {bug.description}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => onDismiss(bug, suggestionType)}
        disabled={dismissing}
        title="Dismiss this suggestion"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function SimilarBugsCard({ bugId, organizationSlug }: SimilarBugsCardProps) {
  const {
    similarBugs,
    hasEmbedding,
    loading,
    error,
    dismissing,
    handleDismiss,
  } = useSimilarBugsWithDismiss(bugId);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Similar Bugs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Similar Bugs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <FileWarning className="h-4 w-4" />
            Failed to load similar bugs
          </div>
        </CardContent>
      </Card>
    );
  }

  // No embedding yet
  if (!hasEmbedding) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Similar Bugs</CardTitle>
          </div>
          <CardDescription>AI-powered duplicate and related bug detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Analyzing bug content... Check back in a moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDuplicates = similarBugs?.possibleDuplicates && similarBugs.possibleDuplicates.length > 0;
  const hasRelated = similarBugs?.relatedBugs && similarBugs.relatedBugs.length > 0;
  const isEmpty = !hasDuplicates && !hasRelated;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Similar Bugs</CardTitle>
        </div>
        <CardDescription>AI-powered duplicate and related bug detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEmpty && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No similar bugs found. This appears to be a unique issue.
          </div>
        )}

        {hasDuplicates && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="font-medium text-sm">Possible Duplicates</h4>
              <Badge variant="destructive" className="text-xs">
                High similarity
              </Badge>
            </div>
            <div className="space-y-2">
              {similarBugs!.possibleDuplicates.map((bug) => (
                <SimilarBugItem
                  key={bug.id}
                  bug={bug}
                  suggestionType="duplicate"
                  organizationSlug={organizationSlug}
                  onDismiss={handleDismiss}
                  dismissing={dismissing}
                />
              ))}
            </div>
          </div>
        )}

        {hasRelated && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Related Bugs</h4>
              <Badge variant="secondary" className="text-xs">
                Similar issues
              </Badge>
            </div>
            <div className="space-y-2">
              {similarBugs!.relatedBugs.map((bug) => (
                <SimilarBugItem
                  key={bug.id}
                  bug={bug}
                  suggestionType="related"
                  organizationSlug={organizationSlug}
                  onDismiss={handleDismiss}
                  dismissing={dismissing}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
