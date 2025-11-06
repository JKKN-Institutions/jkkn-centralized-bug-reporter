'use client';

import { useState } from 'react';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  UserPlus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  useSuperAdminsList,
  useAddSuperAdmin,
  useRemoveSuperAdmin
} from '@/hooks/super-admins/use-super-admins-list';
import { formatDistanceToNow } from 'date-fns';

/**
 * Super Admin Management Page
 * Add/remove super admin privileges
 */
export default function SuperAdminsPage() {
  const { data: superAdmins, isLoading } = useSuperAdminsList();
  const addSuperAdmin = useAddSuperAdmin();
  const removeSuperAdmin = useRemoveSuperAdmin();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddSuperAdmin = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      await addSuperAdmin.mutateAsync({
        email: email.trim(),
        notes: notes.trim() || undefined
      });

      // Success - close dialog and reset form
      setIsAddDialogOpen(false);
      setEmail('');
      setNotes('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add super admin'
      );
    }
  };

  const handleRemoveSuperAdmin = async (superAdminId: string) => {
    if (
      !confirm('Are you sure you want to remove this super admin privilege?')
    ) {
      return;
    }

    try {
      await removeSuperAdmin.mutateAsync(superAdminId);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to remove super admin'
      );
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <Link href='/admin/dashboard'>
            <Button variant='ghost' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Dashboard
            </Button>
          </Link>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg'>
                <Shield className='h-6 w-6' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Super Admin Management
                </h1>
                <p className='text-gray-600'>
                  Manage platform super administrators
                </p>
              </div>
            </div>

            {/* Add Super Admin Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 gap-2'>
                  <UserPlus className='h-4 w-4' />
                  Add Super Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant Super Admin Privileges</DialogTitle>
                  <DialogDescription>
                    Grant super admin privileges to a user by their email
                    address
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                  {error && (
                    <Alert variant='destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='email'>User Email *</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='user@example.com'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className='text-xs text-gray-500'>
                      User must already have an account
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='notes'>Notes (Optional)</Label>
                    <Textarea
                      id='notes'
                      placeholder='Reason for granting super admin privileges...'
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEmail('');
                      setNotes('');
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSuperAdmin}
                    disabled={addSuperAdmin.isPending}
                    className='bg-gradient-to-r from-purple-600 to-purple-800'
                  >
                    {addSuperAdmin.isPending ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Adding...
                      </>
                    ) : (
                      'Grant Privileges'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className='border-purple-200 bg-purple-50'>
          <Shield className='h-4 w-4 text-purple-600' />
          <AlertDescription className='text-purple-900'>
            Super admins have full platform access. They can create
            organizations, manage all users, and access all bug reports across
            the platform.
          </AlertDescription>
        </Alert>

        {/* Super Admins List */}
        <Card className='border-2 shadow-lg'>
          <CardHeader>
            <CardTitle>Current Super Admins</CardTitle>
            <CardDescription>
              Users with platform-wide administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
              </div>
            ) : !superAdmins || superAdmins.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Shield className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p>No super admins found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Granted At</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='font-medium'>
                            {admin.user?.user_metadata?.full_name || 'Unknown'}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {admin.user?.email || admin.user_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{admin.granted_by || 'System'}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDistanceToNow(new Date(admin.granted_at), {
                            addSuffix: true
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm text-gray-600 max-w-xs truncate'>
                          {admin.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveSuperAdmin(admin.id)}
                          disabled={removeSuperAdmin.isPending}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
