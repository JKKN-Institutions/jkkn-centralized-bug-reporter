'use client';

import { Trophy, Award, Medal } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      cardBg: 'bg-gradient-to-br from-gray-100 to-gray-200',
      borderColor: 'border-gray-400',
      rankBadge: 'bg-gray-500',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-900',
    },
    {
      entry: first,
      rank: 1,
      icon: Trophy,
      cardBg: 'bg-gradient-to-br from-yellow-100 to-amber-200',
      borderColor: 'border-yellow-500',
      rankBadge: 'bg-yellow-500',
      iconColor: 'text-yellow-700',
      textColor: 'text-yellow-900',
    },
    {
      entry: third,
      rank: 3,
      icon: Award,
      cardBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
      borderColor: 'border-orange-500',
      rankBadge: 'bg-orange-500',
      iconColor: 'text-orange-700',
      textColor: 'text-orange-900',
    },
  ];

  return (
    <div className="flex items-end justify-center gap-6 py-10 px-4">
      {positions.map((pos, idx) =>
        pos.entry ? (
          <Card
            key={idx}
            className={`
              w-64 ${pos.cardBg} border-4 ${pos.borderColor}
              shadow-xl relative
              ${pos.rank === 1 ? 'transform scale-110' : ''}
            `}
          >
            {/* Rank Badge */}
            <div className={`
              absolute -top-5 left-1/2 -translate-x-1/2
              ${pos.rankBadge} text-white rounded-full
              w-12 h-12 flex items-center justify-center
              font-black text-xl shadow-xl border-4 border-white
            `}>
              {pos.rank}
            </div>

            <div className="p-6 pt-10 space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <pos.icon className={`${pos.rank === 1 ? 'h-16 w-16' : 'h-12 w-12'} ${pos.iconColor}`} />
              </div>

              {/* Avatar */}
              <div className="flex justify-center">
                <div className={`
                  w-16 h-16 rounded-full
                  ${pos.rank === 1 ? 'bg-yellow-600' : pos.rank === 2 ? 'bg-gray-600' : 'bg-orange-600'}
                  flex items-center justify-center text-white font-black text-2xl
                  border-4 border-white shadow-lg
                `}>
                  {(pos.entry.reporter_name || pos.entry.reporter_email).charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Name */}
              <div className="text-center space-y-1">
                <h3 className={`font-black text-lg ${pos.textColor} leading-tight`}>
                  {pos.entry.reporter_name || 'Anonymous'}
                </h3>
                <p className="text-sm text-gray-700 font-medium truncate">
                  {pos.entry.reporter_email}
                </p>
              </div>

              {/* Points */}
              <div className="bg-white rounded-xl p-4 text-center border-2 border-gray-200 shadow-md">
                <div className={`text-5xl font-black ${pos.textColor}`}>
                  {pos.entry.total_points}
                </div>
                <div className="text-xs font-bold text-gray-600 uppercase mt-1">POINTS</div>
              </div>

              {/* Bugs */}
              <div className="bg-white rounded-lg p-3 text-center border-2 border-gray-200">
                <div className={`text-lg font-bold ${pos.textColor}`}>
                  {pos.entry.total_bugs} {pos.entry.total_bugs === 1 ? 'Bug' : 'Bugs'}
                </div>
              </div>
            </div>
          </Card>
        ) : null
      )}
    </div>
  );
}
