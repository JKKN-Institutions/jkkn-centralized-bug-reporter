'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingClientService } from '@/lib/services/messaging/client';
import type { TypingIndicator } from '@bug-reporter/shared';

/**
 * Hook for typing indicators with real-time updates
 */
export function useTypingIndicator(bugReportId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const supabase = createClient();

  // Fetch typing users
  const fetchTypingUsers = useCallback(async () => {
    if (!bugReportId) {
      setTypingUsers([]);
      return;
    }

    try {
      const data = await MessagingClientService.getTypingUsers(bugReportId);
      setTypingUsers(
        data.map((item: any) => ({
          user_id: item.user_id,
          user_email: item.user?.email || '',
          user_name: item.user?.full_name,
        }))
      );
    } catch (error) {
      console.error('[hooks/typing-indicator] Error fetching typing users:', error);
    }
  }, [bugReportId]);

  useEffect(() => {
    fetchTypingUsers();
  }, [fetchTypingUsers]);

  // Subscribe to typing changes
  useEffect(() => {
    if (!bugReportId) return;

    const channel = supabase
      .channel(`bug_typing:${bugReportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bug_report_typing',
          filter: `bug_report_id=eq.${bugReportId}`,
        },
        () => {
          // Refetch typing users on any change
          fetchTypingUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bugReportId, fetchTypingUsers, supabase]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!bugReportId) return;
      await MessagingClientService.setTyping(bugReportId, isTyping);
    },
    [bugReportId]
  );

  return {
    typingUsers,
    setTyping,
  };
}
