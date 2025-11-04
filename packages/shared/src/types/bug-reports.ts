// Bug Report Status Types
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical';

export type BugReportCategory =
  | 'ui'
  | 'functionality'
  | 'performance'
  | 'security'
  | 'other';

export interface BugReport {
  id: string;
  organization_id: string;
  application_id: string;

  // Bug information
  title: string;
  description: string;
  category: BugReportCategory;
  priority: BugReportPriority;
  status: BugReportStatus;

  // Reporter information
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_user_id?: string | null;

  // System information
  browser_info?: any;
  system_info?: any;
  screenshot_url?: string | null;
  page_url: string;
  console_logs?: any;

  // Assignment
  assigned_to?: string | null;

  // Points for gamification
  points: number;

  // Metadata
  is_resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;

  // Optional relations (populated via joins)
  application?: {
    id: string;
    name: string;
    slug: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    email: string;
    raw_user_meta_data?: any;
  };
  messages?: BugReportMessage[];
}

export interface BugReportMessage {
  id: string;
  bug_report_id: string;
  user_id?: string | null;
  message: string;
  created_at: string;

  // Optional relations (populated via joins)
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
  }[];
}

export interface BugReportParticipant {
  id: string;
  bug_report_id: string;
  user_id: string;
  added_at: string;
}

export interface BugReportFilters {
  organization_id?: string;
  application_id?: string;
  status?: BugReportStatus;
  category?: BugReportCategory;
  priority?: BugReportPriority;
  assigned_to?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface BugReportStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_category: {
    ui: number;
    functionality: number;
    performance: number;
    security: number;
    other: number;
  };
  recent_count: number;
}

// SDK-specific types
export interface CreateBugReportPayload {
  page_url: string;
  title: string;
  description: string;
  category?: BugReportCategory;
  screenshot_data_url?: string;
  console_logs?: any[];
  metadata?: object;

  // User context (optional, provided by SDK)
  user_email?: string;
  user_name?: string;
  user_id?: string;
}

export interface UpdateBugReportPayload {
  id: string;
  title?: string;
  description?: string;
  category?: BugReportCategory;
  priority?: BugReportPriority;
  status?: BugReportStatus;
  assigned_to?: string | null;
  points?: number;
}
