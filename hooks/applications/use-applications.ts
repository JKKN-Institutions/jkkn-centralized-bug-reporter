'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationClientService } from '@/lib/services/applications/client';
import type {
  Application,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  RegenerateApiKeyResponse,
} from '@boobalan_jkkn/shared';
import toast from 'react-hot-toast';

/**
 * Hook to fetch all applications for an organization
 */
export function useApplications(organizationId: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await ApplicationClientService.getOrganizationApplications(organizationId);
      setApplications(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(message);
      console.error('[hooks/applications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook to fetch a specific application by slug
 */
export function useApplication(organizationId: string, slug: string) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplication() {
      if (!organizationId || !slug) return;

      try {
        setLoading(true);
        setError(null);

        const data = await ApplicationClientService.getApplicationBySlug(organizationId, slug);
        if (!data) {
          setError('Application not found');
        } else {
          setApplication(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch application';
        setError(message);
        console.error('[hooks/applications] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplication();
  }, [organizationId, slug]);

  return {
    application,
    loading,
    error,
  };
}

/**
 * Hook to create a new application
 */
export function useCreateApplication(organizationSlug: string) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const createApplication = useCallback(
    async (payload: CreateApplicationPayload) => {
      try {
        setCreating(true);

        const newApp = await ApplicationClientService.createApplication(payload);

        toast.success('Application created successfully!');

        // Redirect to application detail page
        router.push(`/org/${organizationSlug}/apps/${newApp.slug}`);

        return newApp;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create application';
        toast.error(message);
        console.error('[hooks/applications] Create error:', err);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [organizationSlug, router]
  );

  return {
    createApplication,
    creating,
  };
}

/**
 * Hook to update an application
 */
export function useUpdateApplication() {
  const [updating, setUpdating] = useState(false);

  const updateApplication = useCallback(async (payload: UpdateApplicationPayload) => {
    try {
      setUpdating(true);

      const updated = await ApplicationClientService.updateApplication(payload);

      toast.success('Application updated successfully!');

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      toast.error(message);
      console.error('[hooks/applications] Update error:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updateApplication,
    updating,
  };
}

/**
 * Hook to delete an application
 */
export function useDeleteApplication(organizationSlug: string) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const deleteApplication = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);

        await ApplicationClientService.deleteApplication(id);

        toast.success('Application deleted successfully');

        // Redirect to applications list
        router.push(`/org/${organizationSlug}/apps`);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete application';
        toast.error(message);
        console.error('[hooks/applications] Delete error:', err);
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [organizationSlug, router]
  );

  return {
    deleteApplication,
    deleting,
  };
}

/**
 * Hook to regenerate API key for an application
 */
export function useRegenerateApiKey() {
  const [regenerating, setRegenerating] = useState(false);

  const regenerateApiKey = useCallback(async (id: string): Promise<RegenerateApiKeyResponse> => {
    try {
      setRegenerating(true);

      const result = await ApplicationClientService.regenerateApiKey(id);

      toast.success('API key regenerated successfully!');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate API key';
      toast.error(message);
      console.error('[hooks/applications] Regenerate API key error:', err);
      throw err;
    } finally {
      setRegenerating(false);
    }
  }, []);

  return {
    regenerateApiKey,
    regenerating,
  };
}
