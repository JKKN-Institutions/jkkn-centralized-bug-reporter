'use client';

import { useState, useEffect, useCallback } from 'react';
import { TeamClientService } from '@/lib/services/team/client';
import type {
  OrganizationMember,
  OrganizationInvitation,
  InviteMemberPayload,
  UpdateMemberRolePayload,
  TeamStats,
} from '@bug-reporter/shared';
import toast from 'react-hot-toast';

/**
 * Hook to fetch all team members for an organization
 */
export function useTeamMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await TeamClientService.getOrganizationMembers(organizationId);
      setMembers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(message);
      console.error('[hooks/team-members] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}

/**
 * Hook to invite a member to the organization
 */
export function useInviteMember() {
  const [inviting, setInviting] = useState(false);

  const inviteMember = useCallback(async (payload: InviteMemberPayload) => {
    try {
      setInviting(true);

      const invitation = await TeamClientService.inviteMember(payload);

      toast.success(`Invitation sent to ${payload.email}`);

      return invitation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(message);
      console.error('[hooks/invite-member] Invite error:', err);
      throw err;
    } finally {
      setInviting(false);
    }
  }, []);

  return {
    inviteMember,
    inviting,
  };
}

/**
 * Hook to fetch pending invitations
 */
export function useInvitations(organizationId: string) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) {
      setInvitations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await TeamClientService.getInvitations(organizationId);
      setInvitations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invitations';
      setError(message);
      console.error('[hooks/invitations] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    refetch: fetchInvitations,
  };
}

/**
 * Hook to update a member's role
 */
export function useUpdateMemberRole() {
  const [updating, setUpdating] = useState(false);

  const updateRole = useCallback(async (payload: UpdateMemberRolePayload) => {
    try {
      setUpdating(true);

      const updated = await TeamClientService.updateMemberRole(payload);

      toast.success('Member role updated successfully');

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
      console.error('[hooks/update-role] Update error:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updateRole,
    updating,
  };
}

/**
 * Hook to remove a member from the organization
 */
export function useRemoveMember() {
  const [removing, setRemoving] = useState(false);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      setRemoving(true);

      await TeamClientService.removeMember(memberId);

      toast.success('Member removed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast.error(message);
      console.error('[hooks/remove-member] Remove error:', err);
      throw err;
    } finally {
      setRemoving(false);
    }
  }, []);

  return {
    removeMember,
    removing,
  };
}

/**
 * Hook to revoke an invitation
 */
export function useRevokeInvitation() {
  const [revoking, setRevoking] = useState(false);

  const revokeInvitation = useCallback(async (invitationId: string) => {
    try {
      setRevoking(true);

      await TeamClientService.revokeInvitation(invitationId);

      toast.success('Invitation revoked');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke invitation';
      toast.error(message);
      console.error('[hooks/revoke-invitation] Revoke error:', err);
      throw err;
    } finally {
      setRevoking(false);
    }
  }, []);

  return {
    revokeInvitation,
    revoking,
  };
}

/**
 * Hook to resend an invitation
 */
export function useResendInvitation() {
  const [resending, setResending] = useState(false);

  const resendInvitation = useCallback(async (invitationId: string) => {
    try {
      setResending(true);

      await TeamClientService.resendInvitation(invitationId);

      toast.success('Invitation resent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      toast.error(message);
      console.error('[hooks/resend-invitation] Resend error:', err);
      throw err;
    } finally {
      setResending(false);
    }
  }, []);

  return {
    resendInvitation,
    resending,
  };
}

/**
 * Hook to get team statistics
 */
export function useTeamStats(organizationId: string) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!organizationId) {
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await TeamClientService.getTeamStats(organizationId);
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(message);
      console.error('[hooks/team-stats] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
