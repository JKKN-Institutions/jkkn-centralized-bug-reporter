'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OrganizationClientService } from '@/lib/services/organizations/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug, Mail, Lock, ArrowRight } from 'lucide-react';
import { SiteNavbar } from '@/components/shared/site-navbar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get user's organizations and redirect to first one
        try {
          const orgs = await OrganizationClientService.getUserOrganizations();

          if (orgs && orgs.length > 0) {
            // Redirect to first organization
            router.push(`/org/${orgs[0].slug}`);
          } else {
            // No organizations, redirect to create one
            router.push('/org/new');
          }
          router.refresh();
        } catch (orgError) {
          console.error('[Login] Error fetching organizations:', orgError);
          // Fallback to org creation page
          router.push('/org/new');
          router.refresh();
        }
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='flex items-center justify-center p-4 pt-16'>
        <div className='w-full max-w-md'>
          {/* Login Card */}
          <Card className='border-2 shadow-xl'>
            <CardHeader className='space-y-1 pb-4'>
              <CardTitle className='text-2xl font-bold text-center'>
                Sign In
              </CardTitle>
              <CardDescription className='text-center'>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className='space-y-5'>
                {error && (
                  <Alert variant='destructive' className='border-red-200'>
                    <AlertDescription className='text-sm'>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-sm font-medium'>
                    Email Address
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                    <Input
                      id='email'
                      type='email'
                      placeholder='you@jkkn.ac.in'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className='pl-10 h-11 border-2'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='password' className='text-sm font-medium'>
                      Password
                    </Label>
                    <Link
                      href='/forgot-password'
                      className='text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className='pl-10 h-11 border-2'
                    />
                  </div>
                </div>

                <Button
                  type='submit'
                  className='w-full h-11 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-base font-medium shadow-md'
                  disabled={loading}
                >
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Signing in...
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      Sign In
                      <ArrowRight className='h-4 w-4' />
                    </span>
                  )}
                </Button>

                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-gray-500'>
                      New to JKKN Bug Reporter?
                    </span>
                  </div>
                </div>

                <div className='text-center'>
                  <Link href='/signup'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full h-11 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700 font-medium'
                    >
                      Create New Account
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className='text-center mt-6'>
            <Link
              href='/'
              className='text-sm text-gray-600 hover:text-gray-900 hover:underline'
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
