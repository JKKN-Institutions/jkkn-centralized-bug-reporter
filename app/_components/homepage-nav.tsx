'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OrganizationClientService } from '@/lib/services/organizations/client';
import { useRouter } from 'next/navigation';

export function HomepageNav() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userOrg, setUserOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        try {
          const orgs = await OrganizationClientService.getUserOrganizations();
          if (orgs && orgs.length > 0) {
            setUserOrg(orgs[0]);
          }
        } catch (error) {
          console.error('Error fetching organizations:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserOrg(null);
    router.refresh();
  };

  if (loading) {
    return (
      <nav className='flex items-center gap-3'>
        <div className='h-9 w-20 bg-gray-200 animate-pulse rounded'></div>
        <div className='h-9 w-24 bg-gray-200 animate-pulse rounded'></div>
      </nav>
    );
  }

  if (user && userOrg) {
    return (
      <nav className='flex items-center gap-3'>
        <Link href={`/org/${userOrg.slug}`}>
          <Button
            size='sm'
            className='bg-gradient-to-r from-blue-600 to-blue-800 cursor-pointer'
          >
            <LayoutDashboard className='h-4 w-4 mr-2' />
            Dashboard
          </Button>
        </Link>
        <Button
          onClick={handleLogout}
          variant='ghost'
          size='sm'
          className='cursor-pointer'
        >
          <LogOut className='h-4 w-4 mr-2' />
          Logout
        </Button>
      </nav>
    );
  }

  return (
    <nav className='flex items-center gap-3'>
      <Link href='/login'>
        <Button
          variant='ghost'
          size='sm'
          className='cursor-pointer bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:text-white'
        >
          Sign in
        </Button>
      </Link>
    </nav>
  );
}
