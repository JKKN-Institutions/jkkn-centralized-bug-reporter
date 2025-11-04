export type OrganizationRole = 'owner' | 'admin' | 'developer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  settings?: {
    bug_bounty?: {
      weekly_prize?: number;
      currency?: string;
      internship_wins_required?: number;
      enabled?: boolean;
    };
    [key: string]: any;
  };
  subscription_tier?: 'free' | 'pro' | 'enterprise';
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url?: string | null;
  }[];
}

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  settings?: Organization['settings'];
}

export interface UpdateOrganizationPayload {
  id: string;
  name?: string;
  slug?: string;
  settings?: Organization['settings'];
}

export interface InviteMemberPayload {
  organization_id: string;
  email: string;
  role: OrganizationRole;
}
