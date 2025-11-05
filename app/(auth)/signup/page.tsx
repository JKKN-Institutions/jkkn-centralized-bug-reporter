'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createOrganizationAction } from '@/lib/actions/organizations';
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
import {
  Bug,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Check
} from 'lucide-react';
import { SiteNavbar } from '@/components/shared/site-navbar';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      if (!formData.organizationName.trim()) {
        setError('Organization name is required');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName || null
            }
          }
        }
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create user account');
        setLoading(false);
        return;
      }

      // CRITICAL: Check if session was created
      if (!authData.session) {
        setError('Session was not created. Please try logging in.');
        setLoading(false);
        return;
      }

      // IMPORTANT: Wait for session to be fully persisted to storage
      // This prevents race condition between signUp and createOrganization
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify session is accessible before proceeding
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      if (!verifiedSession) {
        setError('Session not available. Please try logging in.');
        setLoading(false);
        return;
      }

      // Step 2: Create organization using Server Action (proper auth context)
      const orgSlug = generateSlug(formData.organizationName);

      console.log('[Signup] Calling server action to create organization');

      const { data: org, error: orgError } = await createOrganizationAction({
        name: formData.organizationName.trim(),
        slug: orgSlug
      });

      if (orgError || !org) {
        console.error('[Signup] Organization creation error:', orgError);
        setError(orgError || 'Failed to create organization');
        setLoading(false);
        return;
      }

      console.log('[Signup] Organization created successfully:', org.slug);

      // Success! Redirect to verify email or organization dashboard
      // Use window.location for hard redirect after server action
      const redirectUrl = authData.user.email_confirmed_at
        ? `/org/${orgSlug}`
        : `/verify-email?email=${encodeURIComponent(formData.email)}`;

      console.log('[Signup] Redirecting to:', redirectUrl);

      // Hard redirect to ensure clean navigation
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('[Signup] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    {
      text: 'Passwords match',
      met:
        formData.password === formData.confirmPassword &&
        formData.password.length > 0
    }
  ];

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50'>
    
      <div className='flex items-center justify-center p-4 pt-16'>
        <div className='w-full max-w-lg'>
          {/* Signup Card */}
          <Card className='border-2 shadow-xl'>
            <CardHeader className='space-y-1 pb-4'>
              <CardTitle className='text-2xl font-bold text-center'>
                Create Account
              </CardTitle>
              <CardDescription className='text-center'>
                Get started with your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className='space-y-4'>
                {error && (
                  <Alert variant='destructive' className='border-red-200'>
                    <AlertDescription className='text-sm'>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='fullName' className='text-sm font-medium'>
                    Full Name
                  </Label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                    <Input
                      id='fullName'
                      type='text'
                      placeholder='John Doe'
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      disabled={loading}
                      className='pl-10 h-11 border-2'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-sm font-medium'>
                    Email Address *
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                    <Input
                      id='email'
                      type='email'
                      placeholder='you@jkkn.ac.in'
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      disabled={loading}
                      className='pl-10 h-11 border-2'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='organizationName'
                    className='text-sm font-medium'
                  >
                    Organization Name *
                  </Label>
                  <div className='relative'>
                    <Building2 className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                    <Input
                      id='organizationName'
                      type='text'
                      placeholder='Your Department/Organization'
                      value={formData.organizationName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationName: e.target.value
                        })
                      }
                      required
                      disabled={loading}
                      className='pl-10 h-11 border-2'
                    />
                  </div>
                  {formData.organizationName && (
                    <p className='text-xs text-blue-600 font-medium'>
                      URL slug: /{generateSlug(formData.organizationName)}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-sm font-medium'>
                      Password *
                    </Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                      <Input
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        disabled={loading}
                        className='pl-10 h-11 border-2'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='confirmPassword'
                      className='text-sm font-medium'
                    >
                      Confirm Password *
                    </Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                      <Input
                        id='confirmPassword'
                        type='password'
                        placeholder='••••••••'
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value
                          })
                        }
                        required
                        disabled={loading}
                        className='pl-10 h-11 border-2'
                      />
                    </div>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className='bg-gray-50 rounded-lg p-3 space-y-2'>
                  <p className='text-xs font-medium text-gray-700'>
                    Password Requirements:
                  </p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          req.met ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <Check className='h-3 w-3 text-white' />
                      </div>
                      <span
                        className={`text-xs ${
                          req.met ? 'text-green-700' : 'text-gray-600'
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  type='submit'
                  className='w-full h-11 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-base font-medium shadow-md'
                  disabled={loading}
                >
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Creating account...
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      Create Account
                      <ArrowRight className='h-4 w-4' />
                    </span>
                  )}
                </Button>

                <p className='text-xs text-gray-500 text-center'>
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>

                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-gray-500'>
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className='text-center'>
                  <Link href='/login'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full h-11 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700 font-medium'
                    >
                      Sign In Instead
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
