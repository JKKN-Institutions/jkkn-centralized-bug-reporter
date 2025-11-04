import { OrganizationServerService } from '@/lib/services/organizations/server';
import { OrganizationStats } from './_components/organization-stats';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppWindow, Bug, Users, Trophy, ArrowRight, Calendar, Shield, Zap } from 'lucide-react';

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

  const quickActions = [
    {
      title: 'Manage Applications',
      description: 'Add, edit, or remove applications',
      href: `/org/${slug}/apps`,
      icon: AppWindow,
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      title: 'View Bug Reports',
      description: 'Browse and manage all bug reports',
      href: `/org/${slug}/bugs`,
      icon: Bug,
      gradient: 'from-red-500 to-red-700'
    },
    {
      title: 'Manage Team',
      description: 'Invite and manage team members',
      href: `/org/${slug}/team`,
      icon: Users,
      gradient: 'from-green-500 to-green-700'
    },
    {
      title: 'View Leaderboard',
      description: 'Check top bug reporters',
      href: `/org/${slug}/leaderboard`,
      icon: Trophy,
      gradient: 'from-yellow-500 to-yellow-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {organization.name}
          </h1>
          <p className="text-slate-600 flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-600" />
            Organization Dashboard & Overview
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <OrganizationStats stats={stats} />

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Organization Info & Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Organization Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Key information about your organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <dt className="text-sm font-medium text-slate-600">Organization Slug</dt>
                <dd className="text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
                  /{organization.slug}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <dt className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {new Date(organization.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-slate-600">Bug Bounty Program</dt>
                <dd>
                  {organization.settings?.bug_bounty?.enabled ? (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      ✓ Enabled
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      Disabled
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bug className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New bug report submitted</p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New team member joined</p>
                  <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <AppWindow className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New application registered</p>
                  <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
