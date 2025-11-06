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
  Building2,
  Users,
  Shield,
  Bug,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalBugReports: number;
  totalApplications: number;
  totalSuperAdmins: number;
  recentOrganizations: number;
}

/**
 * Super Admin Dashboard
 * Central hub for platform administration
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();

        // Fetch all stats in parallel
        const [
          { count: orgCount },
          { count: userCount },
          { count: bugCount },
          { count: appCount },
          { count: superAdminCount },
        ] = await Promise.all([
          supabase.from('organizations').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('bug_reports').select('*', { count: 'exact', head: true }),
          supabase.from('applications').select('*', { count: 'exact', head: true }),
          supabase.from('super_admins').select('*', { count: 'exact', head: true }),
        ]);

        // Get recent organizations (created in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: recentOrgCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        setStats({
          totalOrganizations: orgCount || 0,
          totalUsers: userCount || 0,
          totalBugReports: bugCount || 0,
          totalApplications: appCount || 0,
          totalSuperAdmins: superAdminCount || 0,
          recentOrganizations: recentOrgCount || 0,
        });
      } catch (error) {
        console.error('[Admin Dashboard] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg'>
              <LayoutDashboard className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Super Admin Dashboard
              </h1>
              <p className='text-gray-600'>
                Platform-wide administration and management
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <Card className='border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Organizations
                </CardTitle>
                <Building2 className='h-4 w-4 text-blue-600' />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              ) : (
                <>
                  <div className='text-3xl font-bold text-blue-600'>
                    {stats?.totalOrganizations || 0}
                  </div>
                  <p className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                    <TrendingUp className='h-3 w-3 text-green-600' />
                    {stats?.recentOrganizations || 0} new this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className='border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Total Users
                </CardTitle>
                <Users className='h-4 w-4 text-green-600' />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className='h-8 w-8 animate-spin text-green-600' />
              ) : (
                <>
                  <div className='text-3xl font-bold text-green-600'>
                    {stats?.totalUsers || 0}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Platform-wide users</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className='border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Bug Reports
                </CardTitle>
                <Bug className='h-4 w-4 text-orange-600' />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className='h-8 w-8 animate-spin text-orange-600' />
              ) : (
                <>
                  <div className='text-3xl font-bold text-orange-600'>
                    {stats?.totalBugReports || 0}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Across all apps</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className='border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Applications
                </CardTitle>
                <ArrowUpRight className='h-4 w-4 text-purple-600' />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className='h-8 w-8 animate-spin text-purple-600' />
              ) : (
                <>
                  <div className='text-3xl font-bold text-purple-600'>
                    {stats?.totalApplications || 0}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Active applications</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Organizations Management */}
          <Card className='border-2 hover:shadow-xl transition-all hover:-translate-y-1'>
            <CardHeader className='space-y-3'>
              <div className='p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md w-fit'>
                <Building2 className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl'>Organizations</CardTitle>
                <CardDescription className='text-base'>
                  Create and manage organizations across the platform
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                <span className='text-sm font-medium text-blue-900'>
                  Total Organizations
                </span>
                <span className='text-lg font-bold text-blue-600'>
                  {loading ? <Loader2 className='h-5 w-5 animate-spin' /> : stats?.totalOrganizations || 0}
                </span>
              </div>
              <p className='text-sm text-gray-600'>
                Create new organizations, assign members, and manage
                organization-level settings. Only super admins can create
                organizations.
              </p>
              <Link href='/admin/organizations'>
                <Button className='w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'>
                  Manage Organizations
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card className='border-2 hover:shadow-xl transition-all hover:-translate-y-1'>
            <CardHeader className='space-y-3'>
              <div className='p-3 bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-md w-fit'>
                <Users className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl'>Users & Access</CardTitle>
                <CardDescription className='text-base'>
                  Manage user accounts and application access
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                <span className='text-sm font-medium text-green-900'>
                  Total Users
                </span>
                <span className='text-lg font-bold text-green-600'>
                  {loading ? <Loader2 className='h-5 w-5 animate-spin' /> : stats?.totalUsers || 0}
                </span>
              </div>
              <p className='text-sm text-gray-600'>
                View all users, assign them to organizations and applications,
                and manage their access levels and roles.
              </p>
              <Link href='/admin/users'>
                <Button className='w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'>
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Users Approval */}
          <Card className='border-2 hover:shadow-xl transition-all hover:-translate-y-1'>
            <CardHeader className='space-y-3'>
              <div className='p-3 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-md w-fit'>
                <UserCheck className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl'>Pending Approvals</CardTitle>
                <CardDescription className='text-base'>
                  Review and approve user access requests
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg'>
                <span className='text-sm font-medium text-yellow-900'>
                  Awaiting Approval
                </span>
                <span className='text-lg font-bold text-yellow-600'>
                  New
                </span>
              </div>
              <p className='text-sm text-gray-600'>
                Approve or reject new user access requests. Users must be
                approved before they can access the platform.
              </p>
              <Link href='/admin/pending-users'>
                <Button className='w-full bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900'>
                  Review Approvals
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Super Admins Management */}
          <Card className='border-2 hover:shadow-xl transition-all hover:-translate-y-1'>
            <CardHeader className='space-y-3'>
              <div className='p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md w-fit'>
                <Shield className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl'>Super Admins</CardTitle>
                <CardDescription className='text-base'>
                  Manage platform super administrators
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg'>
                <span className='text-sm font-medium text-purple-900'>
                  Super Admins
                </span>
                <span className='text-lg font-bold text-purple-600'>
                  {loading ? <Loader2 className='h-5 w-5 animate-spin' /> : stats?.totalSuperAdmins || 0}
                </span>
              </div>
              <p className='text-sm text-gray-600'>
                Grant or revoke super admin privileges. Super admins have full
                platform access and can manage all organizations.
              </p>
              <Link href='/admin/super-admins'>
                <Button className='w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'>
                  Manage Super Admins
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bug Reports Overview */}
          <Card className='border-2 hover:shadow-xl transition-all hover:-translate-y-1'>
            <CardHeader className='space-y-3'>
              <div className='p-3 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-md w-fit'>
                <Bug className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='text-xl'>Platform Analytics</CardTitle>
                <CardDescription className='text-base'>
                  View platform-wide bug reports and statistics
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-orange-50 rounded-lg'>
                <span className='text-sm font-medium text-orange-900'>
                  Total Bug Reports
                </span>
                <span className='text-lg font-bold text-orange-600'>
                  {loading ? <Loader2 className='h-5 w-5 animate-spin' /> : stats?.totalBugReports || 0}
                </span>
              </div>
              <p className='text-sm text-gray-600'>
                Monitor bug report trends, see platform-wide statistics, and
                analyze usage patterns across all organizations.
              </p>
              <Link href='/admin/analytics'>
                <Button className='w-full bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900'>
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Platform Settings */}
        <Card className='border-2'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                <Settings className='h-5 w-5 text-gray-600' />
              </div>
              <div>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure platform-wide settings and preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href='/admin/settings'>
              <Button variant='outline' className='border-2'>
                Open Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Back to Regular View */}
        <div className='text-center pt-4'>
          <Link
            href='/login'
            className='text-sm text-gray-600 hover:text-gray-900 hover:underline inline-flex items-center gap-1'
          >
            <span>←</span> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
