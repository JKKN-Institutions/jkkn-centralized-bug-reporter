'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { acceptInvitation, acceptAllInvitations, type Invitation } from './actions';

interface AcceptInvitationsClientProps {
  invitations: Invitation[];
  email: string;
}

/**
 * Client component for accepting invitations
 */
export function AcceptInvitationsClient({ invitations, email }: AcceptInvitationsClientProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptInvitation = async (invitationId: string, orgSlug: string) => {
    try {
      setAccepting(invitationId);
      setError(null);

      const result = await acceptInvitation(invitationId, orgSlug);

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      // Redirect to the organization
      router.push(`/org/${orgSlug}`);
    } catch (err) {
      console.error('[Accept Invitations Client] Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setAccepting(null);
    }
  };

  const handleAcceptAllInvitations = async () => {
    try {
      setAcceptingAll(true);
      setError(null);

      const result = await acceptAllInvitations(email);

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitations');
      }

      // Redirect to first organization
      if (result.redirectSlug) {
        router.push(`/org/${result.redirectSlug}`);
      }
    } catch (err) {
      console.error('[Accept Invitations Client] Error accepting all invitations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to accept some invitations'
      );
      setAcceptingAll(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        <Card className='border-2 shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex justify-center'>
              <div className='p-4 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg'>
                <Mail className='h-10 w-10 text-white' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-center'>
              You Have Pending Invitations!
            </CardTitle>
            <CardDescription className='text-center text-base'>
              Accept your invitations to join organizations
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Error Alert */}
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {invitations.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-gray-600'>No pending invitations found</p>
                <Button
                  onClick={() => router.push('/login')}
                  variant='outline'
                  className='mt-4'
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                {/* Invitations List */}
                <div className='space-y-3'>
                  {invitations.map((invitation) => (
                    <Card key={invitation.id} className='border-2'>
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3 flex-1'>
                            <div className='p-2 bg-blue-100 rounded-lg'>
                              <Building2 className='h-5 w-5 text-blue-600' />
                            </div>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>
                                {invitation.organization.name}
                              </div>
                              <div className='flex items-center gap-2 mt-1'>
                                <Badge variant='secondary'>
                                  {invitation.role}
                                </Badge>
                                <span className='text-xs text-gray-500'>
                                  {invitation.organization.slug}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleAcceptInvitation(
                                invitation.id,
                                invitation.organization.slug
                              )
                            }
                            disabled={accepting === invitation.id || acceptingAll}
                            className='bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900'
                          >
                            {accepting === invitation.id ? (
                              <>
                                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className='h-4 w-4 mr-2' />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Accept All Button */}
                {invitations.length > 1 && (
                  <Button
                    onClick={handleAcceptAllInvitations}
                    disabled={accepting !== null || acceptingAll}
                    className='w-full h-12 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-base font-medium'
                  >
                    {acceptingAll ? (
                      <>
                        <Loader2 className='h-5 w-5 animate-spin mr-2' />
                        Accepting All...
                      </>
                    ) : (
                      <span className='flex items-center gap-2'>
                        Accept All Invitations
                        <ArrowRight className='h-5 w-5' />
                      </span>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className='mt-8 p-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg'>
          <p className='text-xs text-gray-600 text-center'>
            <strong>Note:</strong> By accepting these invitations, you will
            gain access to the organizations and their applications.
          </p>
        </div>
      </div>
    </div>
  );
}
