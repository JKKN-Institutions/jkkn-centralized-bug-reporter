'use client';

import { OrganizationForm } from '../_components/organization-form';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useUpdateOrganization } from '@/hooks/organizations/use-organizations';

export default function SettingsPage() {
  const { organization, loading } = useOrganizationContext();
  const { updateOrganization, updating } = useUpdateOrganization();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization configuration</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <OrganizationForm
            organization={organization}
            onSubmit={async (values) => {
              await updateOrganization({
                id: organization.id,
                ...values,
              });
            }}
            submitLabel={updating ? 'Saving...' : 'Save Changes'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
