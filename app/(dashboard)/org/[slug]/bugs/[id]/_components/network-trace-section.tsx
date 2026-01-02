'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Network,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type { NetworkRequest } from '@bug-reporter/shared';

interface NetworkTraceSectionProps {
  networkTrace: NetworkRequest[];
}

// Get status badge color based on HTTP status
function getStatusColor(status: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status >= 500) return 'destructive';
  if (status >= 400) return 'destructive';
  if (status >= 300) return 'secondary';
  if (status >= 200) return 'default';
  return 'outline';
}

// Get status indicator
function StatusIndicator({ status }: { status: number }) {
  if (status === 0) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  if (status >= 400) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  if (status >= 200 && status < 300) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  return <ArrowRight className="h-4 w-4 text-yellow-500" />;
}

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Format URL for display
function formatUrl(url: string): { origin: string; path: string } {
  try {
    const parsed = new URL(url);
    return {
      origin: parsed.origin,
      path: parsed.pathname + parsed.search,
    };
  } catch {
    return { origin: '', path: url };
  }
}

// Network request item component
function NetworkRequestItem({ request }: { request: NetworkRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const { origin, path } = formatUrl(request.url);
  const hasError = request.status === 0 || request.status >= 400;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
            hasError ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20' : 'bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <StatusIndicator status={request.status} />
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {request.method}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {origin}
              </span>
              <span className="font-mono text-sm truncate">
                {path}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={getStatusColor(request.status)} className="font-mono">
              {request.status || 'ERR'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(request.duration_ms)}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-6 mt-2 p-4 bg-muted/50 rounded-lg border space-y-4">
          {/* Error message if any */}
          {request.error && (
            <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {request.error}
            </div>
          )}

          {/* Request Details */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Request Details
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex">
                <span className="w-24 text-muted-foreground">URL:</span>
                <span className="font-mono break-all">{request.url}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-muted-foreground">Method:</span>
                <span className="font-mono">{request.method}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-muted-foreground">Status:</span>
                <span className="font-mono">
                  {request.status} {request.statusText}
                </span>
              </div>
              <div className="flex">
                <span className="w-24 text-muted-foreground">Duration:</span>
                <span className="font-mono">{formatDuration(request.duration_ms)}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-muted-foreground">Timestamp:</span>
                <span className="font-mono">
                  {new Date(request.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Request Headers */}
          {Object.keys(request.request_headers || {}).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Request Headers
              </h4>
              <div className="space-y-1 text-xs font-mono bg-background rounded p-2 border">
                {Object.entries(request.request_headers).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-muted-foreground min-w-[150px]">{key}:</span>
                    <span className="break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Headers */}
          {Object.keys(request.response_headers || {}).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Response Headers
              </h4>
              <div className="space-y-1 text-xs font-mono bg-background rounded p-2 border">
                {Object.entries(request.response_headers).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-muted-foreground min-w-[150px]">{key}:</span>
                    <span className="break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NetworkTraceSection({ networkTrace }: NetworkTraceSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return networkTrace.filter((request) => {
      // Filter by errors
      if (showOnlyErrors && request.status !== 0 && request.status < 400) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.url.toLowerCase().includes(searchLower) ||
          request.method.toLowerCase().includes(searchLower) ||
          String(request.status).includes(searchLower)
        );
      }

      return true;
    });
  }, [networkTrace, showOnlyErrors, searchQuery]);

  // Count errors
  const errorCount = useMemo(() => {
    return networkTrace.filter(
      (r) => r.status === 0 || r.status >= 400
    ).length;
  }, [networkTrace]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Trace
            </CardTitle>
            <CardDescription>
              {filteredRequests.length} of {networkTrace.length} request(s) shown
              {errorCount > 0 && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  ({errorCount} failed)
                </span>
              )}
            </CardDescription>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search network requests..."
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
          <Button
            variant={showOnlyErrors ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Errors Only
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {errorCount}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No network requests match your filters</p>
            {(searchQuery || showOnlyErrors) && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setShowOnlyErrors(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredRequests.map((request, index) => (
              <NetworkRequestItem key={request.id || index} request={request} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
