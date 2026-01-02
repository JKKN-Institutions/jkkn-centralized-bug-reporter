# JKKN Bug Reporter - Implementation Summary

## Overview

This document summarizes the implementation of the **Institutional Bug Intelligence Platform** features, focusing on AI-powered similarity detection and network trace capture capabilities.

---

## Phase 1: AI-Powered Similarity Detection

### Purpose
Automatically detect duplicate and related bug reports using semantic similarity powered by OpenAI embeddings and pgvector.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Bug Report    │────▶│  Vercel Cron Job │────▶│  OpenAI API     │
│   Submitted     │     │  (every 1 min)   │     │  Embeddings     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │   PostgreSQL     │
                        │   pgvector       │
                        │   (1536-dim)     │
                        └──────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌──────────────────┐
│   Dashboard     │◀────│  Similar Bugs    │
│   UI Component  │     │  API Endpoint    │
└─────────────────┘     └──────────────────┘
```

### Database Schema

#### New Columns on `bug_reports`
```sql
embedding vector(1536)           -- OpenAI embedding vector
embedding_generated_at TIMESTAMPTZ  -- Timestamp of embedding generation
```

#### New Table: `similarity_feedback`
```sql
CREATE TABLE similarity_feedback (
  id UUID PRIMARY KEY,
  bug_report_id UUID NOT NULL,      -- The bug being viewed
  suggested_bug_id UUID NOT NULL,   -- The suggested similar bug
  similarity_score FLOAT NOT NULL,  -- Similarity score at time of dismissal
  suggestion_type TEXT NOT NULL,    -- 'duplicate' or 'related'
  dismissed_at TIMESTAMPTZ,
  dismissed_by_user_id UUID,
  organization_id UUID NOT NULL,
  UNIQUE(bug_report_id, suggested_bug_id)
);
```

#### Database Function: `find_similar_bugs`
```sql
find_similar_bugs(
  target_bug_id UUID,
  min_similarity FLOAT,
  max_results INT
) RETURNS TABLE(...)
```

### Similarity Tiers

| Tier | Similarity Score | Description |
|------|------------------|-------------|
| **Possible Duplicates** | ≥ 0.9 | High confidence duplicates |
| **Related Bugs** | 0.7 - 0.9 | Similar issues that may be related |

### API Endpoints

#### GET `/api/v1/bug-reports/[id]/similar`
Returns similar bugs for a given bug report.

**Response:**
```typescript
interface GetSimilarBugsResponse {
  bug_id: string;
  has_embedding: boolean;
  similar_bugs: {
    possibleDuplicates: SimilarBug[];
    relatedBugs: SimilarBug[];
  };
}
```

#### POST `/api/v1/bug-reports/[id]/similar/dismiss`
Records dismissal of a similarity suggestion (implicit negative feedback).

**Request:**
```typescript
interface DismissSuggestionPayload {
  suggested_bug_id: string;
  similarity_score: number;
  suggestion_type: 'duplicate' | 'related';
}
```

### Cron Job: Embedding Generation

**Endpoint:** `/api/cron/generate-embeddings`
**Schedule:** Every 1 minute
**Batch Size:** 10 bugs per run

**Process:**
1. Query bugs where `embedding IS NULL`
2. Concatenate `title + description` for each bug
3. Generate embedding using OpenAI `text-embedding-3-small`
4. Update bug with embedding and timestamp

### UI Components

#### `SimilarBugsCard` (`app/(dashboard)/org/[slug]/bugs/[id]/_components/similar-bugs-card.tsx`)
- Displays "Possible Duplicates" and "Related Bugs" sections
- Dismiss button (X) for each suggestion
- Loading/error/empty states
- Links to view similar bug details

#### `useSimilarBugs` Hook (`hooks/bug-reports/use-similar-bugs.ts`)
```typescript
const { similarBugs, hasEmbedding, loading, error, refetch } = useSimilarBugs(bugId);
const { dismissSuggestion, dismissing } = useDismissSuggestion();
const { handleDismiss, ... } = useSimilarBugsWithDismiss(bugId);
```

### Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `supabase/migrations/20251231_ai_similarity.sql` | New | Database migration |
| `packages/shared/src/types/similarity.ts` | New | Type definitions |
| `app/api/cron/generate-embeddings/route.ts` | New | Cron job handler |
| `app/api/v1/bug-reports/[id]/similar/route.ts` | New | Similar bugs API |
| `app/api/v1/bug-reports/[id]/similar/dismiss/route.ts` | New | Dismiss API |
| `hooks/bug-reports/use-similar-bugs.ts` | New | React hooks |
| `app/(dashboard)/org/[slug]/bugs/[id]/_components/similar-bugs-card.tsx` | New | UI component |
| `app/(dashboard)/org/[slug]/bugs/[id]/page.tsx` | Modified | Integration |
| `vercel.json` | Modified | Cron configuration |
| `package.json` | Modified | Added openai dependency |

---

## Phase 3: SDK Network Trace Capture

### Purpose
Capture network requests leading up to a bug report to provide developers with context about API calls, failed requests, and timing information.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   SDK captures  │────▶│  Bug Submission  │────▶│   Supabase      │
│   last 10 reqs  │     │  API Endpoint    │     │   metadata      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Dashboard     │
                                                │   Display       │
                                                └─────────────────┘
```

### Data Model

#### NetworkRequest Type
```typescript
interface NetworkRequest {
  id?: string;
  method: string;              // GET, POST, etc.
  url: string;                 // Full URL
  status: number;              // HTTP status code
  statusText: string;          // HTTP status text
  duration_ms: number;         // Request duration
  request_headers: Record<string, string>;
  response_headers: Record<string, string>;
  timestamp: string;           // ISO timestamp
  error?: string;              // Error message if failed
}
```

#### Storage Location
Network trace is stored in `bug_reports.metadata.network_trace` as JSONB.

### API Changes

#### POST `/api/v1/public/bug-reports`
Now accepts `network_trace` in request body:

```typescript
interface SubmitBugReportRequest {
  // ... existing fields
  network_trace?: NetworkRequest[];  // NEW: Array of captured requests
}
```

### UI Components

#### `NetworkTraceSection` (`app/(dashboard)/org/[slug]/bugs/[id]/_components/network-trace-section.tsx`)

**Features:**
- Collapsible list of network requests
- Status indicators (green checkmark, red alert)
- Method badges (GET, POST, etc.)
- Duration display
- Search filtering
- "Errors Only" toggle
- Expandable request/response headers
- Error message display

**Visual States:**
| Status Code | Color | Icon |
|-------------|-------|------|
| 200-299 | Green | CheckCircle |
| 300-399 | Yellow | ArrowRight |
| 400-599 | Red | AlertCircle |
| 0 (Failed) | Red | AlertCircle |

### Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `packages/shared/src/types/api.ts` | Modified | Added NetworkRequest type |
| `packages/shared/src/types/bug-reports.ts` | Modified | Added metadata.network_trace |
| `app/api/v1/public/bug-reports/route.ts` | Modified | Accept network_trace |
| `app/(dashboard)/org/[slug]/bugs/[id]/_components/network-trace-section.tsx` | New | Display component |
| `app/(dashboard)/org/[slug]/bugs/[id]/page.tsx` | Modified | Integration |

---

## SDK Changes Required (External Repository)

The SDK (`@boobalan_jkkn/bug-reporter-sdk`) needs updates to capture network requests.

### New Configuration Options
```typescript
interface BugReporterConfig {
  // ... existing options
  networkCapture?: boolean;      // default: true
  networkBufferSize?: number;    // default: 10
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/network-interceptor.ts` | Create | Fetch/XHR interceptor |
| `src/types/config.ts` | Modify | Add config options |
| `src/components/BugReporterProvider.tsx` | Modify | Initialize interceptor |
| `src/components/BugReporterWidget.tsx` | Modify | Include network_trace |
| `package.json` | Modify | Bump to v1.2.0 |

### Network Interceptor Logic

```typescript
// Pseudo-code for network-interceptor.ts
class NetworkInterceptor {
  private buffer: NetworkRequest[] = [];
  private maxSize: number = 10;

  // Hook into window.fetch
  interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(input, init);
        this.addRequest({...});
        return response;
      } catch (error) {
        this.addRequest({..., error: error.message});
        throw error;
      }
    };
  }

  // Hook into XMLHttpRequest
  interceptXHR() { ... }

  // Circular buffer implementation
  addRequest(request: NetworkRequest) {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(request);
  }

  getRequests(): NetworkRequest[] {
    return [...this.buffer];
  }
}
```

---

## Environment Variables

### Required
```env
# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# Cron job authentication
CRON_SECRET=<random-secret>

# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Vercel Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-embeddings",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## Type Definitions Reference

### Shared Types (`packages/shared/src/types/`)

```typescript
// similarity.ts
export interface SimilarBug {
  id: string;
  display_id: string;
  title: string;
  description: string;
  status: BugReportStatus;
  application_id: string;
  application_name?: string;
  similarity: number;
  created_at: string;
}

export interface SimilarBugsResult {
  possibleDuplicates: SimilarBug[];
  relatedBugs: SimilarBug[];
}

export type SuggestionType = 'duplicate' | 'related';

export interface DismissSuggestionPayload {
  suggested_bug_id: string;
  similarity_score: number;
  suggestion_type: SuggestionType;
}

export interface DismissSuggestionResponse {
  success: boolean;
  feedback_id: string;
}

export interface GetSimilarBugsResponse {
  bug_id: string;
  has_embedding: boolean;
  similar_bugs: SimilarBugsResult;
}
```

---

## Deferred Features (Future Iterations)

### Phase 2: Knowledge Linking
- `fix_commit_url`, `fix_summary`, `documentation_url` columns
- GitHub API integration for commit message auto-extraction
- Fix linking UI on resolved bugs

### Phase 4: Reporter Reputation
- Probationary badge for new reporters
- Reputation filter toggle
- Security category exemption from filtering

### Phase 5: Cross-App Pattern Detection
- Cross-app similarity view using embeddings
- Pattern clustering dashboard
- Affected applications visualization

### Session Replay
- Explicitly out of scope for current iteration

---

## Testing Checklist

### AI Similarity
- [ ] Embedding generation cron job runs successfully
- [ ] Similar bugs API returns correct tiers
- [ ] Dismiss functionality records feedback
- [ ] Dismissed bugs don't appear in subsequent queries
- [ ] UI shows loading/error/empty states correctly

### Network Trace
- [ ] API accepts network_trace in submission
- [ ] Network trace stored in metadata JSONB
- [ ] UI displays network requests correctly
- [ ] Search filtering works
- [ ] "Errors Only" toggle works
- [ ] Request/response headers expandable

---

## Changelog

### v1.0.0 - Initial Implementation (2024-12-31)
- Added AI-powered similarity detection with pgvector
- Added network trace capture support (backend)
- Created embedding generation cron job
- Added similar bugs UI component
- Added network trace display component
