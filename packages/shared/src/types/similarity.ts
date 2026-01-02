// AI Similarity Detection Types
// Used for duplicate and related bug detection

import { BugReportStatus } from './bug-reports';

// =============================================
// SIMILAR BUG TYPES
// =============================================

export interface SimilarBug {
  id: string;
  display_id: string;
  title: string;
  description: string;
  status: BugReportStatus;
  application_id: string;
  application_name?: string;
  similarity: number; // 0-1, higher = more similar
  created_at: string;
}

export interface SimilarBugsResult {
  // Similarity > 0.9 - likely the same issue
  possibleDuplicates: SimilarBug[];
  // Similarity 0.7-0.9 - related issues
  relatedBugs: SimilarBug[];
}

// =============================================
// SIMILARITY FEEDBACK TYPES
// =============================================

export type SuggestionType = 'duplicate' | 'related';

export interface SimilarityFeedback {
  id: string;
  bug_report_id: string;
  suggested_bug_id: string;
  similarity_score: number;
  suggestion_type: SuggestionType;
  dismissed_at: string;
  dismissed_by_user_id: string | null;
  organization_id: string;
}

export interface DismissSuggestionPayload {
  suggested_bug_id: string;
  similarity_score: number;
  suggestion_type: SuggestionType;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface GetSimilarBugsRequest {
  bug_id: string;
  min_similarity?: number; // Default: 0.7
  max_results?: number;    // Default: 6 (3 per tier)
}

export interface GetSimilarBugsResponse {
  bug_id: string;
  has_embedding: boolean;
  similar_bugs: SimilarBugsResult;
}

export interface DismissSuggestionResponse {
  success: boolean;
  feedback_id: string;
}

// =============================================
// CROSS-APP PATTERN TYPES (Future)
// =============================================

export interface CrossAppPattern {
  id: string;
  organization_id: string;
  affected_app_ids: string[];
  affected_app_names: string[];
  related_bug_ids: string[];
  avg_similarity: number;
  first_reported: string;
  pattern_count: number;
}
