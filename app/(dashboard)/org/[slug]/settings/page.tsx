'use client';

import { OrganizationForm } from '../_components/organization-form';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useUpdateOrganization } from '@/hooks/organizations/use-organizations';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { organization, userRole, loading } = useOrganizationContext();
  const { updateOrganization, updating } = useUpdateOrganization();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Only allow owner and admin to access settings
  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <div className='max-w-7xl space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Access Denied</h1>
          <p className='text-muted-foreground'>
            You don't have permission to access this page
          </p>
        </div>

        <Alert variant='destructive'>
          <ShieldAlert className='h-4 w-4' />
          <AlertDescription>
            Only organization owners and administrators can access organization settings.
            If you need to modify organization settings, please contact an administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href={`/org/${organization.slug}`}>
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='max-w-7xl space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Organization Settings</h1>
        <p className='text-muted-foreground'>
          Manage your organization configuration
        </p>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <OrganizationForm
            organization={organization}
            onSubmit={async (values) => {
              await updateOrganization({
                id: organization.id,
                ...values
              });
            }}
            submitLabel={updating ? 'Saving...' : 'Save Changes'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
