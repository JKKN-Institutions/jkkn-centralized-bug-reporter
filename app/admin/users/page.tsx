'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  ArrowLeft,
  Loader2,
  Search,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useSuperAdminsList } from '@/hooks/super-admins/use-super-admins-list';

interface UserWithDetails {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  applications: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  is_super_admin: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
}

interface OrgMembershipResult {
  role: string;
  organizations: Array<{
    id: string;
    name: string;
  }>;
}

interface AppMembershipResult {
  role: string;
  applications: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Users Management Page (Super Admin Only)
 * View all users and their access levels
 */
export default function UsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: superAdmins } = useSuperAdminsList();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For each user, fetch their organizations and applications
      const usersWithDetails: UserWithDetails[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Fetch organization memberships
          const { data: orgMemberships } = await supabase
            .from('organization_members')
            .select(
              `
              role,
              organizations!inner (
                id,
                name
              )
            `
            )
            .eq('user_id', profile.id);

          // Fetch application memberships
          const { data: appMemberships } = await supabase
            .from('application_members')
            .select(
              `
              role,
              applications!inner (
                id,
                name
              )
            `
            )
            .eq('user_id', profile.id);

          // Check if super admin
          const isSuperAdmin =
            superAdmins?.some((sa) => sa.user_id === profile.id) || false;

          // Check approval status
          const { data: approvalData } = await supabase
            .from('user_approvals')
            .select('status')
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || undefined,
            created_at: profile.created_at,
            organizations:
              orgMemberships?.map((om: OrgMembershipResult) => ({
                id: om.organizations[0]?.id || '',
                name: om.organizations[0]?.name || '',
                role: om.role
              })) || [],
            applications:
              appMemberships?.map((am: AppMembershipResult) => ({
                id: am.applications[0]?.id || '',
                name: am.applications[0]?.name || '',
                role: am.role
              })) || [],
            is_super_admin: isSuperAdmin,
            approval_status: approvalData?.status as 'pending' | 'approved' | 'rejected' || null
          };
        })
      );

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('[Users Page] Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [superAdmins]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50'>
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
              <div className='p-3 bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-lg'>
                <Users className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Users & Access
                </h1>
                <p className='text-gray-600'>
                  View all users and their access levels
                </p>
              </div>
            </div>
            <Button
              onClick={fetchUsers}
              disabled={loading}
              variant='outline'
              className='gap-2 border-2 hover:bg-green-50 hover:border-green-300'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className='border-green-200 bg-green-50'>
          <Users className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-900'>
            View all users and their access levels. To assign users to
            organizations, go to{' '}
            <Link
              href='/admin/organizations'
              className='font-medium underline hover:text-green-700'
            >
              Organizations
            </Link>{' '}
            → Select an organization → Team page → Invite members.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <Card className='border-2'>
          <CardContent className='pt-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search users by name or email...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className='border-2 shadow-lg'>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Platform-wide user list with access information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Users className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>
                              {user.full_name || 'Unknown'}
                            </span>
                            {user.is_super_admin && (
                              <Badge
                                variant='secondary'
                                className='bg-purple-100 text-purple-700 border-purple-300'
                              >
                                <Shield className='h-3 w-3 mr-1' />
                                Super Admin
                              </Badge>
                            )}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_super_admin ? (
                          <Badge
                            variant='outline'
                            className='border-purple-300 text-purple-700 bg-purple-50'
                          >
                            <Shield className='h-3 w-3 mr-1' />
                            Super Admin
                          </Badge>
                        ) : user.approval_status === 'approved' ? (
                          <Badge
                            variant='outline'
                            className='border-green-300 text-green-700 bg-green-50'
                          >
                            <CheckCircle2 className='h-3 w-3 mr-1' />
                            Approved
                          </Badge>
                        ) : user.approval_status === 'rejected' ? (
                          <Badge
                            variant='outline'
                            className='border-red-300 text-red-700 bg-red-50'
                          >
                            <XCircle className='h-3 w-3 mr-1' />
                            Rejected
                          </Badge>
                        ) : user.approval_status === 'pending' ? (
                          <Badge
                            variant='outline'
                            className='border-yellow-300 text-yellow-700 bg-yellow-50'
                          >
                            <XCircle className='h-3 w-3 mr-1' />
                            Pending Approval
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='border-gray-300 text-gray-700 bg-gray-50'
                          >
                            No Approval Request
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.organizations.length > 0 ? (
                          <div className='space-y-1'>
                            {user.organizations.slice(0, 2).map((org) => (
                              <div
                                key={org.id}
                                className='flex items-center gap-2 text-sm'
                              >
                                <Building2 className='h-3 w-3 text-gray-400' />
                                <span className='text-gray-700'>
                                  {org.name}
                                </span>
                                <Badge variant='secondary' className='text-xs'>
                                  {org.role}
                                </Badge>
                              </div>
                            ))}
                            {user.organizations.length > 2 && (
                              <div className='text-xs text-gray-500'>
                                +{user.organizations.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.applications.length > 0 ? (
                          <div className='text-sm text-gray-700'>
                            {user.applications.length} app
                            {user.applications.length !== 1 ? 's' : ''}
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='text-sm text-gray-600'>
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true
                          })}
                        </div>
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
