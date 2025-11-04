'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ApplicationForm } from '../_components/application-form';
import { useCreateApplication } from '@/hooks/applications/use-applications';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewApplicationPage() {
  const { organization, loading } = useOrganizationContext();
  const { createApplication, creating } = useCreateApplication(
    organization?.slug || ''
  );

  if (loading) {
    return (
      <div className='max-w-2xl space-y-6'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className='max-w-7xl space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Create Application</h1>
        <p className='text-muted-foreground'>
          Register a new application to start tracking bug reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            Fill in the information about your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm
            onSubmit={async (values) => {
              await createApplication({
                organization_id: organization.id,
                ...values
              });
            }}
            submitLabel={creating ? 'Creating...' : 'Create Application'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
