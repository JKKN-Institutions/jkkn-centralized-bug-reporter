// Organization invitation
export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'developer';
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted: boolean;
  accepted_at?: string | null;

  // Joined inviter data (from profiles join)
  inviter?: {
    id: string;
    email: string;
    full_name: string | null;
  }[];
}

// Update member role payload
export interface UpdateMemberRolePayload {
  member_id: string;
  role: 'admin' | 'developer';
}

// Member stats
export interface TeamStats {
  total_members: number;
  by_role: {
    owner: number;
    admin: number;
    developer: number;
  };
  pending_invitations: number;
}
