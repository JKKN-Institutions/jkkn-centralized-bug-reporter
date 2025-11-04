'use client';

import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useInvitations, useResendInvitation, useRevokeInvitation } from '@/hooks/team/use-team';
import { InvitationsTable } from '../_components/invitations-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InvitationsPage() {
  const { organization, loading: orgLoading } = useOrganizationContext();
  const { invitations, loading: invitationsLoading, refetch } = useInvitations(
    organization?.id || ''
  );
  const { resendInvitation, resending } = useResendInvitation();
  const { revokeInvitation, revoking } = useRevokeInvitation();

  const handleResend = async (invitationId: string) => {
    await resendInvitation(invitationId);
    await refetch();
  };

  const handleRevoke = async (invitationId: string) => {
    await revokeInvitation(invitationId);
    await refetch();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href={`/org/${organization.slug}/team`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Pending Invitations</h1>
          <p className="text-muted-foreground">Manage pending team member invitations</p>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Invitations</h2>
          {invitationsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invitations...</div>
          ) : (
            <InvitationsTable
              invitations={invitations}
              onResend={handleResend}
              onRevoke={handleRevoke}
              isResending={resending}
              isRevoking={revoking}
            />
          )}
        </div>
      </div>
    </div>
  );
}
