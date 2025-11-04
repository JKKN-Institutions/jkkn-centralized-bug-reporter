'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Building, Bug, Users, TrendingUp } from 'lucide-react';

interface OrganizationStatsProps {
  stats: {
    totalApps: number;
    totalBugs: number;
    totalMembers: number;
  };
}

export function OrganizationStats({ stats }: OrganizationStatsProps) {
  const statCards = [
    {
      title: 'Applications',
      value: stats.totalApps,
      description: 'Registered applications',
      icon: Building,
      gradient: 'from-blue-500 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    {
      title: 'Bug Reports',
      value: stats.totalBugs,
      description: 'Total reports submitted',
      icon: Bug,
      gradient: 'from-red-500 to-red-700',
      bgGradient: 'from-red-50 to-red-100'
    },
    {
      title: 'Team Members',
      value: stats.totalMembers,
      description: 'Active team members',
      icon: Users,
      gradient: 'from-green-500 to-green-700',
      bgGradient: 'from-green-50 to-green-100'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-semibold">12%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {stat.description}
                  </p>
                </div>
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
