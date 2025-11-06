'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface InviteMemberDialogProps {
  onInvite: (email: string, role: 'admin' | 'developer') => Promise<void>;
  isInviting: boolean;
}

interface AvailableUser {
  id: string;
  email: string;
  full_name: string | null;
}

export function InviteMemberDialog({ onInvite, isInviting }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'select' | 'manual'>('select');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'developer'>('developer');
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch available users when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open]);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const supabase = createClient();

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setAvailableUsers(users || []);
    } catch (error) {
      console.error('[InviteMemberDialog] Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Update email when user is selected from dropdown
  useEffect(() => {
    if (selectionMode === 'select' && selectedUserId) {
      const user = availableUsers.find((u) => u.id === selectedUserId);
      if (user) {
        setEmail(user.email);
      }
    }
  }, [selectedUserId, availableUsers, selectionMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailToInvite = selectionMode === 'select'
      ? availableUsers.find((u) => u.id === selectedUserId)?.email || ''
      : email;

    if (!emailToInvite) return;

    try {
      await onInvite(emailToInvite, role);
      setEmail('');
      setSelectedUserId('');
      setRole('developer');
      setSelectionMode('select');
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Select an existing user or enter a new email address
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Selection Mode */}
          <div className="space-y-3">
            <Label>How would you like to add a member?</Label>
            <RadioGroup
              value={selectionMode}
              onValueChange={(v) => setSelectionMode(v as 'select' | 'manual')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="select" />
                <Label htmlFor="select" className="font-normal cursor-pointer">
                  Select from existing users
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="font-normal cursor-pointer">
                  Enter email manually
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Input */}
          {selectionMode === 'select' ? (
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="max-h-[200px] overflow-y-auto"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    {availableUsers.length === 0 ? (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No users found
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-sm">
                              {user.full_name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {user.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as 'admin' | 'developer')}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isInviting ||
              (selectionMode === 'select' ? !selectedUserId : !email)
            }
            className="w-full"
          >
            {isInviting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
