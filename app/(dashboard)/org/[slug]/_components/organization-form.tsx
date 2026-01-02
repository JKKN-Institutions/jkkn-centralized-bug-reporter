'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import type { Organization } from '@boobalan_jkkn/shared';

const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  settings: z
    .object({
      bug_bounty: z
        .object({
          enabled: z.boolean().optional(),
          weekly_prize: z.number().optional(),
          currency: z.string().optional(),
          internship_wins_required: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (values: OrganizationFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  submitLabel = 'Create Organization',
}: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      slug: organization?.slug || '',
      settings: {
        bug_bounty: {
          enabled: organization?.settings?.bug_bounty?.enabled || false,
          weekly_prize: organization?.settings?.bug_bounty?.weekly_prize || 500,
          currency: organization?.settings?.bug_bounty?.currency || 'INR',
          internship_wins_required:
            organization?.settings?.bug_bounty?.internship_wins_required || 3,
        },
      },
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    if (!organization) {
      // Only auto-generate for new organizations
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      form.setValue('slug', slug);
    }
  };

  const handleSubmit = async (values: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="My Company"
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>The display name for your organization</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="my-company" disabled={!!organization} />
              </FormControl>
              <FormDescription>
                {organization
                  ? 'URL slug cannot be changed after creation'
                  : 'Used in URLs (e.g., /org/my-company)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bug Bounty Settings</h3>

          <FormField
            control={form.control}
            name="settings.bug_bounty.enabled"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Enable Bug Bounty Program</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.bug_bounty.weekly_prize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekly Prize Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Prize for weekly top bug reporter</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.bug_bounty.internship_wins_required"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wins Required for Internship</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Number of weekly wins needed to qualify for internship
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
