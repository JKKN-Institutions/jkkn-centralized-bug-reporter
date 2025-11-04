// Leaderboard entry for a user
export interface LeaderboardEntry {
  reporter_email: string;
  reporter_name?: string;
  total_bugs: number;
  total_points: number;
  rank: number;
}

// Leaderboard configuration
export interface LeaderboardConfig {
  id: string;
  organization_id: string;
  weekly_prize_amount: number;
  monthly_prize_amount: number;
  prize_description?: string;
  points_critical: number;
  points_high: number;
  points_medium: number;
  points_low: number;
  is_enabled: boolean;
  reset_frequency: 'weekly' | 'monthly' | 'never';
  created_at: string;
  updated_at: string;
}

// Update leaderboard config payload
export interface UpdateLeaderboardConfigPayload {
  organization_id: string;
  weekly_prize_amount?: number;
  monthly_prize_amount?: number;
  prize_description?: string;
  points_critical?: number;
  points_high?: number;
  points_medium?: number;
  points_low?: number;
  is_enabled?: boolean;
  reset_frequency?: 'weekly' | 'monthly' | 'never';
}

// Time period for leaderboard filtering
export type LeaderboardTimePeriod = 'week' | 'month' | 'all-time';
