'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserCog, Trash2, Shield, Code } from 'lucide-react';
import type { OrganizationMember } from '@bug-reporter/shared';

interface MemberActionsProps {
  member: OrganizationMember;
  currentUserRole: string;
  onUpdateRole: (memberId: string, role: 'admin' | 'developer') => void;
  onRemove: (memberId: string) => void;
}

export function MemberActions({
  member,
  currentUserRole,
  onUpdateRole,
  onRemove,
}: MemberActionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Only owners and admins can manage members
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Owners cannot be modified
  const isOwner = member.role === 'owner';

  // Admins can only modify developers
  const canModifyRole =
    currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role === 'developer');

  if (!canManage || isOwner) {
    return null;
  }

  const user = member.user?.[0];
  const displayName = user?.full_name || user?.email || 'this member';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canModifyRole && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserCog className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(member.id, 'admin')}
                  disabled={member.role === 'admin'}
                >
                  <Shield className="mr-2 h-4 w-4 text-blue-600" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(member.id, 'developer')}
                  disabled={member.role === 'developer'}
                >
                  <Code className="mr-2 h-4 w-4 text-green-600" />
                  Developer
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuItem
            onClick={() => setShowRemoveDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {displayName} from this organization? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRemove(member.id);
                setShowRemoveDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
