import { Suspense } from 'react';
import { AcceptInvitationsClient } from './accept-invitations-client';
import { fetchPendingInvitations } from './actions';
import { Loader2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

/**
 * Accept Invitations Page (Server Component)
 * Fetches invitations server-side using admin client
 */
export default async function AcceptInvitationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = params.email || '';

  // Fetch invitations server-side using admin client (bypasses RLS)
  const invitations = await fetchPendingInvitations(email);

  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      }
    >
      <AcceptInvitationsClient invitations={invitations} email={email} />
    </Suspense>
  );
}
