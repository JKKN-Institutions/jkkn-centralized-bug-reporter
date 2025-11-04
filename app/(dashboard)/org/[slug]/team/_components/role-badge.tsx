'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, UserCog, Code } from 'lucide-react';

const roleConfig = {
  owner: { label: 'Owner', icon: Shield, variant: 'default' as const, color: 'text-purple-600' },
  admin: { label: 'Admin', icon: UserCog, variant: 'secondary' as const, color: 'text-blue-600' },
  developer: {
    label: 'Developer',
    icon: Code,
    variant: 'outline' as const,
    color: 'text-green-600',
  },
};

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.developer;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}
