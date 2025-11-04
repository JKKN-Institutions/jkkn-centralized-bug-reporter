'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug } from 'lucide-react';
import { useBugReports } from '@/hooks/bug-reports/use-bug-reports';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { BugReportsDataTable } from './_components/bug-reports-data-table';

export default function BugsPage() {
  const { organization, loading: orgLoading } = useOrganizationContext();
  const { bugs, loading, error } = useBugReports(organization?.id || '');

  if (orgLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
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
          <h1 className="text-3xl font-bold">Bug Reports</h1>
          <p className="text-muted-foreground">
            View and manage bug reports for {organization.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${organization.slug}/bugs/dashboard`}>
            <Bug className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      {bugs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No bug reports yet</p>
            <p className="text-sm text-muted-foreground">
              Bug reports will appear here when users submit them through the SDK
            </p>
          </CardContent>
        </Card>
      ) : (
        <BugReportsDataTable data={bugs} organizationSlug={organization.slug} />
      )}
    </div>
  );
}
