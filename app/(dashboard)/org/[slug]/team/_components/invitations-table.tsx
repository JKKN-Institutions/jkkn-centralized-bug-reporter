'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './role-badge';
import { Mail, MailCheck, Trash2 } from 'lucide-react';
import type { OrganizationInvitation } from '@bug-reporter/shared';

interface InvitationsTableProps {
  invitations: OrganizationInvitation[];
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
  isResending: boolean;
  isRevoking: boolean;
}

export function InvitationsTable({
  invitations,
  onResend,
  onRevoke,
  isResending,
  isRevoking,
}: InvitationsTableProps) {
  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No pending invitations</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Invited At</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => {
          const inviter = invitation.inviter?.[0];
          const inviterName = inviter?.full_name || inviter?.email || 'Unknown';
          const expiresAt = new Date(invitation.expires_at);
          const isExpired = expiresAt < new Date();

          return (
            <TableRow key={invitation.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{invitation.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadge role={invitation.role} />
              </TableCell>
              <TableCell>{inviterName}</TableCell>
              <TableCell>{new Date(invitation.invited_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                  {expiresAt.toLocaleDateString()}
                  {isExpired && ' (Expired)'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResend(invitation.id)}
                    disabled={isResending || isRevoking}
                  >
                    <MailCheck className="h-4 w-4 mr-1" />
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevoke(invitation.id)}
                    disabled={isResending || isRevoking}
                  className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
