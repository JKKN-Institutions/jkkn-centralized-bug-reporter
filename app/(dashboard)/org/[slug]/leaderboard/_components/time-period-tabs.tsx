'use client';

import { Button } from '@/components/ui/button';
import type { LeaderboardTimePeriod } from '@boobalan_jkkn/shared';

interface TimePeriodTabsProps {
  value: LeaderboardTimePeriod;
  onChange: (value: LeaderboardTimePeriod) => void;
}

export function TimePeriodTabs({ value, onChange }: TimePeriodTabsProps) {
  const periods: { value: LeaderboardTimePeriod; label: string; emoji: string }[] = [
    { value: 'week', label: 'This Week', emoji: '📅' },
    { value: 'month', label: 'This Month', emoji: '📆' },
    { value: 'all-time', label: 'All Time', emoji: '🏅' },
  ];

  return (
    <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-lg border shadow-sm">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={`
            transition-all duration-200 font-semibold
            ${value === period.value
              ? 'bg-white shadow-md hover:bg-white'
              : 'hover:bg-gray-200/50'
            }
          `}
        >
          <span className="mr-1.5">{period.emoji}</span>
          {period.label}
        </Button>
      ))}
    </div>
  );
}
