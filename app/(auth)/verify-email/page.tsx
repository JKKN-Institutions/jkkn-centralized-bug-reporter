'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user just verified their email
    const checkVerification = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user && user.email_confirmed_at) {
        // Email is verified, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkVerification();
  }, [router]);

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address not found. Please sign up again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (resendError) {
        setError(resendError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('[VerifyEmail] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold'>Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>
              Verification email sent! Check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-4'>
          <div className='bg-muted p-4 rounded-lg'>
            <p className='text-sm'>
              <strong>Email sent to:</strong> {email || 'your email address'}
            </p>
          </div>

          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Click the verification link in the email to activate your account.
              If you don&apos;t see the email, check your spam folder.
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <Button
              onClick={handleResendEmail}
              variant='outline'
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </Button>

            <Link href='/login'>
              <Button variant='ghost' className='w-full'>
                Back to sign in
              </Button>
            </Link>
          </div>

          <div className='border-t pt-4'>
            <p className='text-xs text-muted-foreground text-center'>
              Already verified your email?{' '}
              <Link href='/login' className='text-primary hover:underline'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>Loading...</div>
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
