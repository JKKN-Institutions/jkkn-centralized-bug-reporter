'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingClientService } from '@/lib/services/messaging/client';
import type { EnhancedBugReportMessage } from '@boobalan_jkkn/shared';

/**
 * Hook for real-time messages with Supabase Realtime
 */
export function useRealtimeMessages(bugReportId: string) {
  const [messages, setMessages] = useState<EnhancedBugReportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!bugReportId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await MessagingClientService.getEnhancedMessages(bugReportId);
      setMessages(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(message);
      console.error('[hooks/realtime-messages] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [bugReportId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!bugReportId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`bug_messages:${bugReportId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bug_report_messages',
          filter: `bug_report_id=eq.${bugReportId}`,
        },
        async (payload) => {
          // Fetch full message with user data
          const { data } = await supabase
            .from('bug_report_messages')
            .select(
              `
              *,
              sender:profiles!sender_user_id(id, email, full_name, avatar_url),
              attachments:bug_report_message_attachments(*),
              reactions:bug_report_message_metadata!message_id(*)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bug_report_messages',
          filter: `bug_report_id=eq.${bugReportId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bug_report_messages',
          filter: `bug_report_id=eq.${bugReportId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bugReportId]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  };
}
