'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserCheck,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  rejected_reason: string | null;
}

/**
 * Pending Users Page (Super Admin Only)
 * Approve or reject user access requests
 */
export default function PendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('user_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPendingUsers(data || []);
    } catch (err) {
      console.error('[Pending Users] Error fetching users:', err);
      setError('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string, userApprovalId: string) => {
    try {
      setActionLoading(userApprovalId);
      setError(null);
      const supabase = createClient();

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update approval status
      const { error: updateError } = await supabase
        .from('user_approvals')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userApprovalId);

      if (updateError) throw updateError;

      // Refresh the list
      await fetchPendingUsers();
    } catch (err) {
      console.error('[Pending Users] Error approving user:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const rejectUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(selectedUser.id);
      setError(null);
      const supabase = createClient();

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update approval status
      const { error: updateError } = await supabase
        .from('user_approvals')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: rejectionReason || 'No reason provided'
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Close dialog and refresh
      setRejectDialogOpen(false);
      setSelectedUser(null);
      await fetchPendingUsers();
    } catch (err) {
      console.error('[Pending Users] Error rejecting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-100 text-green-700 hover:bg-green-100'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-100 text-red-700 hover:bg-red-100'>
            <XCircle className='h-3 w-3 mr-1' />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className='bg-yellow-100 text-yellow-700 hover:bg-yellow-100'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <Link href='/admin/dashboard'>
            <Button variant='ghost' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Dashboard
            </Button>
          </Link>

          <div className='flex items-center gap-3'>
            <div className='p-3 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg'>
              <UserCheck className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Pending User Approvals
              </h1>
              <p className='text-gray-600'>
                Review and approve user access requests
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className='border-purple-200 bg-purple-50'>
          <UserCheck className='h-4 w-4 text-purple-600' />
          <AlertDescription className='text-purple-900'>
            New users must be approved before they can access the platform.
            After approval, users can accept organization invitations and access
            their assigned organizations.
          </AlertDescription>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pending Users List */}
        <Card className='border-2 shadow-lg'>
          <CardHeader>
            <CardTitle>User Access Requests</CardTitle>
            <CardDescription>
              Manage user approval status for platform access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
              </div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <UserCheck className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p>No user approval requests found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className='font-medium'>
                          {user.full_name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm text-gray-600'>
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className='text-sm text-gray-600'>
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true
                          })}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        {user.status === 'pending' ? (
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              size='sm'
                              onClick={() => approveUser(user.user_id, user.id)}
                              disabled={actionLoading === user.id}
                              className='bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <>
                                  <CheckCircle className='h-4 w-4 mr-1' />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => openRejectDialog(user)}
                              disabled={actionLoading === user.id}
                              className='border-red-200 text-red-700 hover:bg-red-50'
                            >
                              <XCircle className='h-4 w-4 mr-1' />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className='text-sm text-gray-500'>
                            {user.status === 'approved'
                              ? 'Approved'
                              : 'Rejected'}
                            {user.approved_at && (
                              <div className='text-xs'>
                                {formatDistanceToNow(
                                  new Date(user.approved_at),
                                  {
                                    addSuffix: true
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Access</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this user&apos;s access request.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>User</Label>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <div className='font-medium'>
                  {selectedUser?.full_name || 'Unknown'}
                </div>
                <div className='text-sm text-gray-600'>
                  {selectedUser?.email}
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='reason'>Rejection Reason (Optional)</Label>
              <Textarea
                id='reason'
                placeholder='Enter reason for rejection...'
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedUser(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={rejectUser}
              disabled={actionLoading === selectedUser?.id}
              className='bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900'
            >
              {actionLoading === selectedUser?.id ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className='h-4 w-4 mr-2' />
                  Reject User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
