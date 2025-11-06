'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    organization,
    userRole,
    loading: orgLoading
  } = useOrganizationContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/login');
        return;
      }

      // Get profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[Profile] Error loading profile:', profileError);
        setError('Failed to load profile');
        return;
      }

      setProfile(profileData);
      setFullName(profileData.full_name || '');
    } catch (err) {
      console.error('[Profile] Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      const supabase = createClient();

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile({
        ...profile,
        full_name: fullName.trim() || null
      });

      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('[Profile] Error saving profile:', err);
      toast.error('Failed to save profile');
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const userInitials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    profile?.email?.charAt(0).toUpperCase() ||
    'U';

  if (orgLoading || loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>Organization not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='max-w-7xl space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>My Profile</h1>
        <p className='text-muted-foreground'>
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
          <CardDescription>
            Your account information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar Section */}
          <div className='flex items-center gap-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className='bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl'>
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>
                {profile.full_name || 'No name set'}
              </h3>
              <p className='text-sm text-muted-foreground'>{profile.email}</p>
              <div className='flex items-center gap-2 text-xs'>
                <span className='px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium'>
                  {userRole === 'owner'
                    ? 'Owner'
                    : userRole === 'admin'
                    ? 'Admin'
                    : 'Developer'}
                </span>
                <span className='text-muted-foreground'>
                  in {organization.name}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className='space-y-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <Shield className='h-4 w-4' />
              Account Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Mail className='h-3 w-3' />
                  Email Address
                </Label>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='font-medium'>{profile.email}</span>
                  <CheckCircle2 className='h-4 w-4 text-green-600' />
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  Member Since
                </Label>
                <div className='text-sm font-medium'>
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your display name and other profile information
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-4'>
            {/* Full Name */}
            <div className='space-y-2'>
              <Label htmlFor='fullName' className='flex items-center gap-1'>
                <User className='h-4 w-4' />
                Full Name
              </Label>
              <Input
                id='fullName'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Enter your full name'
                className='max-w-md'
              />
              <p className='text-xs text-muted-foreground'>
                This name will be displayed to other members in your
                organization
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className='space-y-2'>
              <Label htmlFor='email' className='flex items-center gap-1'>
                <Mail className='h-4 w-4' />
                Email Address
              </Label>
              <Input
                id='email'
                value={profile.email}
                disabled
                className='max-w-md bg-muted'
              />
              <p className='text-xs text-muted-foreground'>
                Email address cannot be changed. Contact support if you need to
                update it.
              </p>
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || fullName === (profile.full_name || '')}
            >
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant='outline'
              onClick={() => setFullName(profile.full_name || '')}
              disabled={saving || fullName === (profile.full_name || '')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className='h-4 w-4' />
        <AlertDescription>
          <strong>Security:</strong> Your account is secured with Google OAuth
          authentication. To change your password or email, please manage your
          Google account settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}
