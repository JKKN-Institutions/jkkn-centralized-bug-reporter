'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '@bug-reporter/shared';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No entries yet. Be the first to report a bug!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Reporter</TableHead>
          <TableHead className="text-right">Bugs Reported</TableHead>
          <TableHead className="text-right">Total Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.reporter_email}>
            <TableCell className="font-medium">
              {entry.rank <= 3 ? (
                <div className="flex items-center gap-2">
                  <Trophy
                    className={`h-4 w-4 ${
                      entry.rank === 1
                        ? 'text-yellow-500'
                        : entry.rank === 2
                        ? 'text-slate-400'
                        : 'text-amber-600'
                    }`}
                  />
                  {entry.rank}
                </div>
              ) : (
                entry.rank
              )}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">
                  {entry.reporter_name || 'Anonymous'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.reporter_email}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">{entry.total_bugs}</TableCell>
            <TableCell className="text-right font-bold">{entry.total_points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
