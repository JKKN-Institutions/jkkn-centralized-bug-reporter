'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ExternalLink } from 'lucide-react';
import { useApplications } from '@/hooks/applications/use-applications';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';

export default function ApplicationsPage() {
  const { organization, loading: orgLoading } = useOrganizationContext();
  const { applications, loading, error } = useApplications(organization?.id || '');

  if (orgLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Manage applications for {organization.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${organization.slug}/apps/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No applications yet</p>
            <Button asChild>
              <Link href={`/org/${organization.slug}/apps/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first application
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Link
                    href={`/org/${organization.slug}/apps/${app.slug}`}
                    className="hover:underline"
                  >
                    {app.name}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {app.app_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-muted-foreground inline">Slug: </dt>
                    <dd className="inline font-mono">{app.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground inline">Created: </dt>
                    <dd className="inline">
                      {new Date(app.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {app._stats && (
                    <div>
                      <dt className="text-muted-foreground inline">Bugs: </dt>
                      <dd className="inline">{app._stats.total_bugs}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/org/${organization.slug}/apps/${app.slug}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
