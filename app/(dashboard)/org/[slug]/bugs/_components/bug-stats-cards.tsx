'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, Clock, CheckCircle2, Eye, FileX, Sparkles } from 'lucide-react';
import type { BugReportStats } from '@boobalan_jkkn/shared';

interface BugStatsCardsProps {
  stats: BugReportStats | null;
  loading?: boolean;
}

export function BugStatsCards({ stats, loading }: BugStatsCardsProps) {
  if (loading) return <div>Loading stats...</div>;
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Bugs',
      value: stats.total,
      icon: Bug,
      color: 'text-blue-600',
    },
    {
      title: 'Open',
      value: stats.by_status.open,
      icon: Sparkles,
      color: 'text-purple-600',
    },
    {
      title: 'In Progress',
      value: stats.by_status.in_progress,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Resolved',
      value: stats.by_status.resolved,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      title: 'Closed',
      value: stats.by_status.closed,
      icon: FileX,
      color: 'text-gray-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
