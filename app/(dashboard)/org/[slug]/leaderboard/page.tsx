'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationContext } from '@/hooks/organizations/use-organization-context';
import { useLeaderboard } from '@/hooks/leaderboard/use-leaderboard';
import { useLeaderboardConfig } from '@/hooks/leaderboard/use-leaderboard-config';
import { LeaderboardPodium } from './_components/leaderboard-podium';
import { LeaderboardTable } from './_components/leaderboard-table';
import { PrizeCard } from './_components/prize-card';
import { TimePeriodTabs } from './_components/time-period-tabs';
import type { LeaderboardTimePeriod } from '@boobalan_jkkn/shared';

export default function LeaderboardPage() {
  const { organization, userRole, loading: orgLoading } = useOrganizationContext();
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>('week');
  const { entries, loading: entriesLoading } = useLeaderboard(
    organization?.id || '',
    timePeriod
  );
  const { config } = useLeaderboardConfig(organization?.id || '');

  const topThree = entries.slice(0, 3);
  const canManageSettings = userRole === 'owner' || userRole === 'admin';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bug Reporter Leaderboard</h1>
          <p className="text-muted-foreground">
            Top bug reporters and their rankings
          </p>
        </div>
        {canManageSettings && (
          <Button variant="outline" asChild>
            <Link href={`/org/${organization.slug}/leaderboard/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Prize Settings
            </Link>
          </Button>
        )}
      </div>

      {/* Prize Cards */}
      <PrizeCard config={config} />

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rankings</CardTitle>
            <TimePeriodTabs value={timePeriod} onChange={setTimePeriod} />
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {topThree.length > 0 && <LeaderboardPodium topThree={topThree} />}
              <div className="mt-6">
                <LeaderboardTable entries={entries} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
