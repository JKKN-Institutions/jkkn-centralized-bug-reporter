'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from './role-badge';
import { MemberActions } from './member-actions';
import type { OrganizationMember } from '@bug-reporter/shared';

interface MembersTableProps {
  members: OrganizationMember[];
  currentUserRole: string;
  onUpdateRole: (memberId: string, role: 'admin' | 'developer') => void;
  onRemoveMember: (memberId: string) => void;
}

export function MembersTable({
  members,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
}: MembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const user = member.user?.[0];
          const fullName = user?.full_name;
          const avatarUrl = user?.avatar_url || undefined;
          const email = user?.email || 'Unknown';

          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{email[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{fullName || email}</div>
                    {fullName && <div className="text-sm text-muted-foreground">{email}</div>}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadge role={member.role} />
              </TableCell>
              <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <MemberActions
                  member={member}
                  currentUserRole={currentUserRole}
                  onUpdateRole={onUpdateRole}
                  onRemove={onRemoveMember}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
