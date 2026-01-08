'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Gift } from 'lucide-react';
import type { LeaderboardConfig } from '@boobalan_jkkn/shared';

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
    <div className="grid gap-6 md:grid-cols-2">
      {hasWeeklyPrize && (
        <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-800">
              <div className="p-2 rounded-full bg-green-200">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              Weekly Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-green-700 mb-2">
              ${config.weekly_prize_amount.toFixed(2)}
            </div>
            <p className="text-sm text-green-700/80 font-medium">
              🎯 Awarded to #1 reporter each week
            </p>
          </CardContent>
        </Card>
      )}

      {hasMonthlyPrize && (
        <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-purple-800">
              <div className="p-2 rounded-full bg-purple-200">
                <Gift className="h-5 w-5 text-purple-700" />
              </div>
              Monthly Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-purple-700 mb-2">
              ${config.monthly_prize_amount.toFixed(2)}
            </div>
            <p className="text-sm text-purple-700/80 font-medium">
              🏆 Awarded to #1 reporter each month
            </p>
          </CardContent>
        </Card>
      )}

      {hasPrizeDescription && (
        <Card className="md:col-span-2 border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              Additional Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-900 leading-relaxed">{config.prize_description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
