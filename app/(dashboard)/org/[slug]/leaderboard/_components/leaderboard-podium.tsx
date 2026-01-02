'use client';

import { Trophy, Award, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { LeaderboardEntry } from '@boobalan_jkkn/shared';

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  if (topThree.length === 0) return null;

  const [first, second, third] = topThree;

  const positions = [
    {
      entry: second,
      rank: 2,
      icon: Medal,
      color: 'text-slate-400',
      bgColor: 'bg-slate-50',
      height: 'h-32',
    },
    {
      entry: first,
      rank: 1,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      height: 'h-40',
    },
    {
      entry: third,
      rank: 3,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      height: 'h-28',
    },
  ];

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {positions.map((pos, idx) =>
        pos.entry ? (
          <Card key={idx} className="w-32">
            <CardContent
              className={`p-4 text-center ${pos.height} ${pos.bgColor} flex flex-col justify-end`}
            >
              <pos.icon className={`h-8 w-8 mx-auto mb-2 ${pos.color}`} />
              <div className="font-bold text-lg">#{pos.rank}</div>
              <div className="text-sm font-medium truncate" title={pos.entry.reporter_name || pos.entry.reporter_email}>
                {pos.entry.reporter_name || pos.entry.reporter_email}
              </div>
              <div className="text-xs text-muted-foreground">{pos.entry.total_points} pts</div>
              <div className="text-xs text-muted-foreground">{pos.entry.total_bugs} bugs</div>
            </CardContent>
          </Card>
        ) : null
      )}
    </div>
  );
}
