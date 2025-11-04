'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Gift } from 'lucide-react';
import type { LeaderboardConfig } from '@bug-reporter/shared';

interface PrizeCardProps {
  config: LeaderboardConfig | null;
}

export function PrizeCard({ config }: PrizeCardProps) {
  if (!config || !config.is_enabled) return null;

  const hasWeeklyPrize = config.weekly_prize_amount > 0;
  const hasMonthlyPrize = config.monthly_prize_amount > 0;
  const hasPrizeDescription = !!config.prize_description;

  if (!hasWeeklyPrize && !hasMonthlyPrize && !hasPrizeDescription) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hasWeeklyPrize && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              Weekly Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${config.weekly_prize_amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awarded to top bug reporter each week
            </p>
          </CardContent>
        </Card>
      )}

      {hasMonthlyPrize && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-purple-600" />
              Monthly Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${config.monthly_prize_amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awarded to top bug reporter each month
            </p>
          </CardContent>
        </Card>
      )}

      {hasPrizeDescription && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Additional Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{config.prize_description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
