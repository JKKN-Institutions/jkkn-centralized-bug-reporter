'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminStatus } from '@/hooks/super-admins/use-super-admin-status';
import { Loader2 } from 'lucide-react';

/**
 * Admin Layout with Super Admin Guard
 * Only super admins can access admin routes
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: isSuperAdmin, isLoading } = useSuperAdminStatus();

  useEffect(() => {
    // Redirect non-super-admins to login
    if (!isLoading && !isSuperAdmin) {
      console.log('[Admin Layout] Non-super-admin detected, redirecting to login');
      router.push('/login');
    }
  }, [isSuperAdmin, isLoading, router]);

  // Show loading state while checking super admin status
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto' />
          <p className='text-sm text-gray-600'>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content for non-super-admins
  if (!isSuperAdmin) {
    return null;
  }

  // Render admin content for super admins
  return (
    <div className='min-h-screen bg-gray-50'>
      {children}
    </div>
  );
}
