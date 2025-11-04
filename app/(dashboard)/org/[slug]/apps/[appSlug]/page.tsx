import { ApplicationServerService } from '@/lib/services/applications/server';
import { OrganizationServerService } from '@/lib/services/organizations/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ApplicationStats } from '../_components/application-stats';
import { ApiKeyDisplay } from '../_components/api-key-display';
import { ExternalLink, Settings, Trash2 } from 'lucide-react';

interface ApplicationPageProps {
  params: Promise<{
    slug: string;
    appSlug: string;
  }>;
}

export default async function ApplicationPage({ params }: ApplicationPageProps) {
  const { slug, appSlug } = await params;

  const organization = await OrganizationServerService.getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const application = await ApplicationServerService.getApplicationBySlug(
    organization.id,
    appSlug
  );

  if (!application) {
    notFound();
  }

  const stats = await ApplicationServerService.getApplicationStats(application.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{application.name}</h1>
          <p className="text-muted-foreground">Application dashboard and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/org/${slug}/apps/${appSlug}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <ApplicationStats stats={stats} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Info</CardTitle>
            <CardDescription>Basic information about your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm">{application.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Slug</dt>
              <dd className="text-sm font-mono">{application.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">URL</dt>
              <dd className="text-sm">
                <a
                  href={application.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {application.app_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm">
                {new Date(application.created_at).toLocaleDateString()}
              </dd>
            </div>
            {application.settings?.allowed_domains &&
              application.settings.allowed_domains.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-2">
                    Allowed Domains
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {application.settings.allowed_domains.map((domain) => (
                      <Badge key={domain} variant="secondary">
                        {domain}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Use this API key in your SDK integration</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyDisplay apiKey={application.api_key} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/org/${slug}/bugs?app=${appSlug}`}>View Bug Reports</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/org/${slug}/apps/${appSlug}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
