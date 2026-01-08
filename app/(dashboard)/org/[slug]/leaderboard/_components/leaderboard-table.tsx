'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry } from '@boobalan_jkkn/shared';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Trophy className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground">No entries yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Be the first to report a bug and climb to the top of the leaderboard!
        </p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (rank === 2) return 'bg-slate-100 text-slate-700 border-slate-300';
    if (rank === 3) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-50 hover:to-indigo-50">
            <TableHead className="w-20 font-bold text-gray-700">Rank</TableHead>
            <TableHead className="font-bold text-gray-700">Reporter</TableHead>
            <TableHead className="text-right font-bold text-gray-700">
              <div className="flex items-center justify-end gap-1">
                <TrendingUp className="h-4 w-4" />
                Bugs
              </div>
            </TableHead>
            <TableHead className="text-right font-bold text-gray-700">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={entry.reporter_email}
              className={`
                ${entry.rank <= 3 ? 'bg-gradient-to-r' : ''}
                ${entry.rank === 1 ? 'from-yellow-50/30 to-amber-50/30 hover:from-yellow-50/50 hover:to-amber-50/50' : ''}
                ${entry.rank === 2 ? 'from-slate-50/30 to-gray-50/30 hover:from-slate-50/50 hover:to-gray-50/50' : ''}
                ${entry.rank === 3 ? 'from-orange-50/30 to-amber-50/30 hover:from-orange-50/50 hover:to-amber-50/50' : ''}
                hover:bg-muted/50 transition-colors
              `}
            >
              <TableCell className="font-medium">
                <div className={`inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border ${getRankBadgeColor(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                  <span className="font-bold">{entry.rank}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {(entry.reporter_name || entry.reporter_email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {entry.reporter_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {entry.reporter_email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                  {entry.total_bugs}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {entry.total_points}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
