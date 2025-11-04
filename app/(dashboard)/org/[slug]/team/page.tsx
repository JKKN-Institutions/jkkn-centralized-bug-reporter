'use client';

import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useTeamMembers, useInviteMember, useUpdateMemberRole, useRemoveMember, useTeamStats } from '@/hooks/team/use-team';
import { MembersTable } from './_components/members-table';
import { InviteMemberDialog } from './_components/invite-member-dialog';
import { TeamStatsCards } from './_components/team-stats-cards';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import type { InviteMemberPayload } from '@bug-reporter/shared';

export default function TeamPage() {
  const { organization, userRole, loading: orgLoading } = useOrganizationContext();
  const { members, loading: membersLoading, refetch: refetchMembers } = useTeamMembers(
    organization?.id || ''
  );
  const { stats, loading: statsLoading } = useTeamStats(organization?.id || '');
  const { inviteMember, inviting } = useInviteMember();
  const { updateRole, updating } = useUpdateMemberRole();
  const { removeMember, removing } = useRemoveMember();

  const handleInvite = async (email: string, role: 'admin' | 'developer') => {
    if (!organization) return;

    const payload: InviteMemberPayload = {
      organization_id: organization.id,
      email,
      role,
    };

    await inviteMember(payload);
    // Refetch stats to update pending invitations count
  };

  const handleUpdateRole = async (memberId: string, role: 'admin' | 'developer') => {
    await updateRole({ member_id: memberId, role });
    await refetchMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
    await refetchMembers();
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Organization not found</div>
      </div>
    );
  }

  const canInvite = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your organization's team members and invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/org/${organization.slug}/team/invitations`}>
              <Mail className="mr-2 h-4 w-4" />
              Invitations
            </Link>
          </Button>
          {canInvite && <InviteMemberDialog onInvite={handleInvite} isInviting={inviting} />}
        </div>
      </div>

      {/* Stats Cards */}
      <TeamStatsCards stats={stats} loading={statsLoading} />

      {/* Members Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Members</h2>
          {membersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : (
            <MembersTable
              members={members}
              currentUserRole={userRole || ''}
              onUpdateRole={handleUpdateRole}
              onRemoveMember={handleRemoveMember}
            />
          )}
        </div>
      </div>
    </div>
  );
}
