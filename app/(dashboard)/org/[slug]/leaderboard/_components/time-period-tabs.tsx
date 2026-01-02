'use client';

import { Button } from '@/components/ui/button';
import type { LeaderboardTimePeriod } from '@boobalan_jkkn/shared';

interface TimePeriodTabsProps {
  value: LeaderboardTimePeriod;
  onChange: (value: LeaderboardTimePeriod) => void;
}

export function TimePeriodTabs({ value, onChange }: TimePeriodTabsProps) {
  const periods: { value: LeaderboardTimePeriod; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all-time', label: 'All Time' },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
