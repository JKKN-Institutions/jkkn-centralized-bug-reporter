'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AllowedDomainsInput } from './allowed-domains-input';
import type { Application } from '@bug-reporter/shared';

const applicationFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  app_url: z.string().url('Must be a valid URL'),
  settings: z.object({
    allowed_domains: z.array(z.string()).optional(),
    webhook_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  }),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationFormProps {
  application?: Application;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  submitLabel?: string;
}

export function ApplicationForm({
  application,
  onSubmit,
  submitLabel = 'Create Application',
}: ApplicationFormProps) {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      name: application?.name || '',
      slug: application?.slug || '',
      app_url: application?.app_url || '',
      settings: {
        allowed_domains: application?.settings?.allowed_domains || [],
        webhook_url: application?.settings?.webhook_url || '',
      },
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    if (!application) {
      // Only auto-generate for new applications
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', slug);
    }
  };

  const handleSubmit = async (values: ApplicationFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Awesome App"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>The display name of your application</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-awesome-app"
                  {...field}
                  disabled={!!application}
                />
              </FormControl>
              <FormDescription>
                URL-friendly identifier for your application
                {application && ' (cannot be changed)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="app_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://myapp.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>The main URL of your application</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.allowed_domains"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed Domains</FormLabel>
              <FormControl>
                <AllowedDomainsInput
                  value={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Domains allowed to submit bug reports (leave empty to allow all)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.webhook_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://myapp.com/webhooks/bugs"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Receive notifications when new bugs are reported
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
