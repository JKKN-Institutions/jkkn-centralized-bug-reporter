import { OrganizationProvider } from '@/hooks/organizations/use-organization-context';
import { OrganizationServerService } from '@/lib/services/organizations/server';
import { notFound } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { slug } = await params;
  const currentOrg = await OrganizationServerService.getOrganizationBySlug(slug);

  if (!currentOrg) {
    notFound();
  }

  return (
    <OrganizationProvider slug={slug}>
      <SidebarProvider>
        <AppSidebar orgSlug={slug} orgName={currentOrg.name} />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 max-w-[1600px]">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
