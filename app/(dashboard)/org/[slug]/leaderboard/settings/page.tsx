'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useLeaderboardConfig } from '@/hooks/leaderboard/use-leaderboard-config';
import { LeaderboardConfigForm } from '../_components/leaderboard-config-form';

export default function LeaderboardSettingsPage() {
  const { organization, userRole, loading: orgLoading } = useOrganizationContext();
  const { config, updating, updateConfig } = useLeaderboardConfig(organization?.id || '');

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Organization not found</div>
      </div>
    );
  }

  const canManageSettings = userRole === 'owner' || userRole === 'admin';

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          You don't have permission to manage leaderboard settings
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href={`/org/${organization.slug}/leaderboard`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leaderboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Leaderboard Settings</h1>
        <p className="text-muted-foreground">
          Configure prize amounts and points for your organization's bug bounty program
        </p>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Prize & Points Configuration</CardTitle>
          <CardDescription>
            Set up rewards and point values for different bug priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaderboardConfigForm
            config={config}
            onSubmit={async (values) => {
              await updateConfig(values);
            }}
            isSubmitting={updating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
