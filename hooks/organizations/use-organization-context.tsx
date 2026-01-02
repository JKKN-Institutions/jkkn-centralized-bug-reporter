'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Organization } from '@boobalan_jkkn/shared';
import { useOrganization } from './use-organizations';
import { useUserRole } from './use-user-role';

interface OrganizationContextValue {
  organization: Organization | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) {
  const { organization, loading: orgLoading, error } = useOrganization(slug);
  const { role: userRole, loading: roleLoading } = useUserRole(organization?.id || '');
  const loading = orgLoading || roleLoading;

  return (
    <OrganizationContext.Provider value={{ organization, userRole, loading, error }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider');
  }

  return context;
}
