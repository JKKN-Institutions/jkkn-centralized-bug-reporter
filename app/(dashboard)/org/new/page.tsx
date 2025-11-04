'use client';

import { OrganizationForm } from '../[slug]/_components/organization-form';
import { useCreateOrganization } from '@/hooks/organizations/use-organizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewOrganizationPage() {
  const { createOrganization, creating } = useCreateOrganization();

  const handleSubmit = async (values: any) => {
    await createOrganization(values);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm
            onSubmit={handleSubmit}
            submitLabel={creating ? 'Creating...' : 'Create Organization'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
