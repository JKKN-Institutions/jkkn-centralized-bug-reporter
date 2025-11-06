'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Extract org slug from pathname (e.g., /org/my-org/... => my-org)
  const orgSlug = pathname?.match(/\/org\/([^\/]+)/)?.[1] || '';

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const userInitials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    'U';

  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4'>
      <div className='flex flex-1 items-center gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />

        {/* Search */}
        <div className='flex-1 max-w-2xl'>
          <form>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search bugs, applications, users...'
                className='pl-10 h-9 w-full bg-background'
              />
            </div>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className='flex items-center gap-2'>
        {/* Notifications */}
        <Button variant='ghost' size='icon' className='relative h-9 w-9'>
          <Bell className='h-4 w-4' />
          <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center'>
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-9 gap-2 px-2'>
              <Avatar className='h-7 w-7'>
                <AvatarFallback className='bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs'>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className='hidden md:flex flex-col items-start'>
                <span className='text-sm font-medium leading-none'>
                  {user?.user_metadata?.full_name || 'User'}
                </span>
                <span className='text-xs text-muted-foreground leading-none mt-1'>
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(orgSlug ? `/org/${orgSlug}/profile` : '/profile')}
            >
              <User className='mr-2 h-4 w-4' />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
