'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Code
} from 'lucide-react';

interface ConsoleLog {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  args?: any[];
}

interface ConsoleLogsSectionProps {
  logs: any[];
}

export function ConsoleLogsSection({ logs }: ConsoleLogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(['log', 'info', 'warn', 'error', 'debug'])
  );

  // Define log level configurations
  const logLevels = [
    {
      type: 'error',
      label: 'Errors',
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      badgeVariant: 'destructive' as const
    },
    {
      type: 'warn',
      label: 'Warnings',
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      badgeVariant: 'default' as const
    },
    {
      type: 'info',
      label: 'Info',
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badgeVariant: 'secondary' as const
    },
    {
      type: 'log',
      label: 'Logs',
      icon: Bug,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-200 dark:border-slate-800',
      badgeVariant: 'outline' as const
    },
    {
      type: 'debug',
      label: 'Debug',
      icon: Code,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800',
      badgeVariant: 'secondary' as const
    },
  ];

  // Toggle level filter
  const toggleLevel = (level: string) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
  };

  // Select all levels
  const selectAllLevels = () => {
    setSelectedLevels(new Set(['log', 'info', 'warn', 'error', 'debug']));
  };

  // Clear all levels
  const clearAllLevels = () => {
    setSelectedLevels(new Set());
  };

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const logType = log.type || log.level || 'log';
      const logMessage = log.message || log.text || JSON.stringify(log);

      // Filter by level
      if (!selectedLevels.has(logType)) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        return logMessage.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [logs, selectedLevels, searchQuery]);

  // Count logs by level
  const logCounts = useMemo(() => {
    const counts: Record<string, number> = {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };

    logs.forEach((log: any) => {
      const logType = log.type || log.level || 'log';
      if (counts[logType] !== undefined) {
        counts[logType]++;
      }
    });

    return counts;
  }, [logs]);

  // Get log level config
  const getLogConfig = (level: string) => {
    return logLevels.find(l => l.type === level) || logLevels[3]; // default to 'log'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Console Logs
            </CardTitle>
            <CardDescription>
              {filteredLogs.length} of {logs.length} log entry(ies) shown
            </CardDescription>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 pt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search console logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Level Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filter by Level</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllLevels}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllLevels}
                  className="h-7 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {logLevels.map((level) => {
                const Icon = level.icon;
                const isSelected = selectedLevels.has(level.type);
                const count = logCounts[level.type];

                return (
                  <Button
                    key={level.type}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleLevel(level.type)}
                    className={`gap-2 ${!isSelected ? 'opacity-50 hover:opacity-100' : ''}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {level.label}
                    <Badge variant={isSelected ? 'secondary' : 'outline'} className="ml-1">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No console logs match your filters</p>
            {searchQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log: any, index: number) => {
              const logType = log.type || log.level || 'log';
              const logMessage = log.message || log.text || JSON.stringify(log);
              const timestamp = log.timestamp || '';
              const config = getLogConfig(logType);
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  className={`font-mono text-xs p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center gap-2 ${config.color}`}>
                      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold uppercase min-w-[50px]">
                        {logType}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="break-all text-foreground">{logMessage}</span>
                      {timestamp && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
