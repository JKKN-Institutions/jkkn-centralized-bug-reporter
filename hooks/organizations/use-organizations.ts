'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationClientService } from '@/lib/services/organizations/client';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '@bug-reporter/shared';
import toast from 'react-hot-toast';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await OrganizationClientService.getUserOrganizations();
      setOrganizations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(message);
      console.error('[hooks/organizations] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations,
  };
}

export function useOrganization(slug: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        setLoading(true);
        setError(null);

        const data = await OrganizationClientService.getOrganizationBySlug(slug);
        if (!data) {
          setError('Organization not found');
        } else {
          setOrganization(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch organization';
        setError(message);
        console.error('[hooks/organizations] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  return {
    organization,
    loading,
    error,
  };
}

export function useCreateOrganization() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const createOrganization = useCallback(
    async (payload: CreateOrganizationPayload) => {
      try {
        setCreating(true);

        const newOrg = await OrganizationClientService.createOrganization(payload);

        toast.success('Organization created successfully!');

        // Redirect to new organization dashboard
        router.push(`/org/${newOrg.slug}`);

        return newOrg;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create organization';
        toast.error(message);
        console.error('[hooks/organizations] Create error:', err);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [router]
  );

  return {
    createOrganization,
    creating,
  };
}

export function useUpdateOrganization() {
  const [updating, setUpdating] = useState(false);

  const updateOrganization = useCallback(
    async (payload: UpdateOrganizationPayload) => {
      try {
        setUpdating(true);

        const updated = await OrganizationClientService.updateOrganization(payload);

        toast.success('Organization updated successfully!');

        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update organization';
        toast.error(message);
        console.error('[hooks/organizations] Update error:', err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  return {
    updateOrganization,
    updating,
  };
}

export function useDeleteOrganization() {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const deleteOrganization = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);

        await OrganizationClientService.deleteOrganization(id);

        toast.success('Organization deleted successfully');

        // Redirect to home or organization list
        router.push('/');

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete organization';
        toast.error(message);
        console.error('[hooks/organizations] Delete error:', err);
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [router]
  );

  return {
    deleteOrganization,
    deleting,
  };
}
