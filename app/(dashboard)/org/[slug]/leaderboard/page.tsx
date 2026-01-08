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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Bug Reporter Leaderboard
          </h1>
          <p className="text-base text-muted-foreground">
            Recognize and reward top contributors in your organization
          </p>
        </div>
        {canManageSettings && (
          <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow" asChild>
            <Link href={`/org/${organization.slug}/leaderboard/settings`}>
              <Settings className="mr-2 h-5 w-5" />
              Prize Settings
            </Link>
          </Button>
        )}
      </div>

      {/* Prize Cards */}
      <PrizeCard config={config} />

      {/* Leaderboard */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🏆 Rankings
            </CardTitle>
            <TimePeriodTabs value={timePeriod} onChange={setTimePeriod} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {entriesLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {topThree.length > 0 && (
                <div className="bg-gradient-to-b from-slate-50 to-white border-b-2">
                  <LeaderboardPodium topThree={topThree} />
                </div>
              )}
              <div className="p-6">
                <LeaderboardTable entries={entries} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
