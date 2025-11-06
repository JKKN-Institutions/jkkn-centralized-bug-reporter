'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

/**
 * Error Content Component with search params
 */
function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'unknown_error';

  const errorMessages: Record<string, { title: string; description: string }> =
    {
      auth_failed: {
        title: 'Authentication Failed',
        description:
          'We could not authenticate your account. This may be due to an invalid or expired session.'
      },
      user_not_found: {
        title: 'User Not Found',
        description:
          'We could not find your user account. Please try signing in again.'
      },
      no_code: {
        title: 'No Authorization Code',
        description:
          'No authorization code was provided by Google. Please try signing in again.'
      },
      unexpected_error: {
        title: 'Unexpected Error',
        description:
          'An unexpected error occurred during authentication. Please try again.'
      },
      unknown_error: {
        title: 'Authentication Error',
        description: 'Something went wrong during the sign-in process.'
      }
    };

  const errorInfo = errorMessages[message] || errorMessages.unknown_error;

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-lg'>
        <Card className='border-2 border-red-200 shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex justify-center'>
              <div className='p-4 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg'>
                <AlertCircle className='h-10 w-10 text-white' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-center text-red-900'>
              {errorInfo.title}
            </CardTitle>
            <CardDescription className='text-center text-base text-red-700'>
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Error Details */}
            <div className='bg-red-50 border-2 border-red-200 rounded-lg p-5'>
              <p className='text-sm text-red-800 text-center'>
                If this problem persists, please contact your system
                administrator or try clearing your browser cookies and cache.
              </p>
            </div>

            {/* Troubleshooting Steps */}
            <div className='space-y-3'>
              <h3 className='font-semibold text-gray-900'>
                Troubleshooting steps:
              </h3>
              <ul className='space-y-2 text-sm text-gray-700'>
                <li className='flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
                  Try signing in again with a different browser
                </li>
                <li className='flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
                  Clear your browser cookies and cache
                </li>
                <li className='flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
                  Make sure you&apos;re using a Google account
                </li>
                <li className='flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
                  Contact your administrator if the issue continues
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <Link href='/login' className='flex-1'>
                <Button className='w-full h-11 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium'>
                  <span className='flex items-center gap-2'>
                    <RefreshCw className='h-4 w-4' />
                    Try Again
                  </span>
                </Button>
              </Link>
              <Link href='/' className='flex-1'>
                <Button
                  variant='outline'
                  className='w-full h-11 border-2 border-gray-300 hover:bg-gray-50 font-medium'
                >
                  <span className='flex items-center gap-2'>
                    <Home className='h-4 w-4' />
                    Go Home
                  </span>
                </Button>
              </Link>
            </div>

            {/* Error Code */}
            <div className='text-center'>
              <p className='text-xs text-gray-500'>
                Error Code:{' '}
                <code className='font-mono bg-gray-100 px-2 py-1 rounded'>
                  {message}
                </code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className='mt-8 text-center'>
          <p className='text-xs text-gray-500'>
            Need help? Contact your platform administrator
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Authentication Error Page
 * Shown when OAuth authentication fails
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center'><div className='text-gray-600'>Loading...</div></div>}>
      <ErrorContent />
    </Suspense>
  );
}
