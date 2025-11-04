'use client';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LeaderboardConfig } from '@bug-reporter/shared';

const formSchema = z.object({
  is_enabled: z.coerce.boolean(),
  weekly_prize_amount: z.coerce.number().min(0),
  monthly_prize_amount: z.coerce.number().min(0),
  prize_description: z.string().optional(),
  points_low: z.coerce.number().min(1),
  points_medium: z.coerce.number().min(1),
  points_high: z.coerce.number().min(1),
  points_critical: z.coerce.number().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaderboardConfigFormProps {
  config: LeaderboardConfig | null;
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function LeaderboardConfigForm({
  config,
  onSubmit,
  isSubmitting = false,
}: LeaderboardConfigFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      is_enabled: config?.is_enabled ?? true,
      weekly_prize_amount: config?.weekly_prize_amount ?? 0,
      monthly_prize_amount: config?.monthly_prize_amount ?? 0,
      prize_description: config?.prize_description ?? '',
      points_low: config?.points_low ?? 10,
      points_medium: config?.points_medium ?? 20,
      points_high: config?.points_high ?? 30,
      points_critical: config?.points_critical ?? 50,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="is_enabled"
          render={({ field }) => (
            <FormItem className="rounded-lg border p-4">
              <FormLabel className="text-base">Enable Leaderboard</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'true')}
                value={field.value ? 'true' : 'false'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Show leaderboard and gamification features
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="weekly_prize_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekly Prize Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_prize_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Prize Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="prize_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Prize Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Top 3 reporters get exclusive swag..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="font-medium">Points Configuration</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <FormField
              control={form.control}
              name="points_low"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points_medium"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medium Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points_high"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points_critical"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Critical Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
}
