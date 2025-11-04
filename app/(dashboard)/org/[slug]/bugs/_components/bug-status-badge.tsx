'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  open: { label: 'Open', variant: 'destructive' as const, color: 'bg-red-500' },
  in_progress: { label: 'In Progress', variant: 'default' as const, color: 'bg-yellow-500' },
  resolved: { label: 'Resolved', variant: 'secondary' as const, color: 'bg-green-500' },
  closed: { label: 'Closed', variant: 'outline' as const, color: 'bg-gray-500' },
};

interface BugStatusBadgeProps {
  status: string;
  className?: string;
}

export function BugStatusBadge({ status, className }: BugStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}
