'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, CheckCircle2, Clock } from 'lucide-react';

interface ApplicationStatsProps {
  stats: {
    total_bugs: number;
    resolved_bugs: number;
    pending_bugs: number;
  };
}

export function ApplicationStats({ stats }: ApplicationStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bug Reports</CardTitle>
          <Bug className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_bugs}</div>
          <p className="text-xs text-muted-foreground">All time bug reports</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.resolved_bugs}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_bugs > 0
              ? `${Math.round((stats.resolved_bugs / stats.total_bugs) * 100)}% resolution rate`
              : 'No bugs yet'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending_bugs}</div>
          <p className="text-xs text-muted-foreground">Open and in progress</p>
        </CardContent>
      </Card>
    </div>
  );
}
