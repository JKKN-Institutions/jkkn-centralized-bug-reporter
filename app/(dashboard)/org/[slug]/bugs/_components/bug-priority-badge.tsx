'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const priorityConfig = {
  low: { label: 'Low', icon: ArrowDown, color: 'text-blue-600 border-blue-600' },
  medium: { label: 'Medium', icon: Minus, color: 'text-yellow-600 border-yellow-600' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-600 border-orange-600' },
  critical: { label: 'Critical', icon: AlertCircle, color: 'text-red-600 border-red-600' },
};

interface BugPriorityBadgeProps {
  priority: string;
  className?: string;
}

export function BugPriorityBadge({ priority, className }: BugPriorityBadgeProps) {
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
