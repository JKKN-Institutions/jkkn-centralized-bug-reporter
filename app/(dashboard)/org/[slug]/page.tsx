import { OrganizationServerService } from '@/lib/services/organizations/server';
import { notFound } from 'next/navigation';
import { DashboardContent } from './_components/dashboard-content';

interface OrganizationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { slug } = await params;
  const organization = await OrganizationServerService.getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const stats = await OrganizationServerService.getOrganizationStats(organization.id);

  return <DashboardContent organization={organization} initialStats={stats} />;
}
