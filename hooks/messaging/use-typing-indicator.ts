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
  useEffect(() => {
    const fetchTypingUsers = async () => {
      if (!bugReportId) {
        setTypingUsers([]);
        return;
      }

      try {
        const data = await MessagingClientService.getTypingUsers(bugReportId);
        setTypingUsers(
          data.map((item) => {
            const user = Array.isArray(item.user) ? item.user[0] : item.user;
            return {
              user_id: item.user_id,
              user_email: user?.email || '',
              user_name: user?.full_name || undefined,
            };
          })
        );
      } catch (error) {
        console.error('[hooks/typing-indicator] Error fetching typing users:', error);
      }
    };

    fetchTypingUsers();
  }, [bugReportId]);

  // Subscribe to typing changes
  useEffect(() => {
    if (!bugReportId) return;

    const fetchTypingUsersForSubscription = async () => {
      try {
        const data = await MessagingClientService.getTypingUsers(bugReportId);
        setTypingUsers(
          data.map((item) => {
            const user = Array.isArray(item.user) ? item.user[0] : item.user;
            return {
              user_id: item.user_id,
              user_email: user?.email || '',
              user_name: user?.full_name || undefined,
            };
          })
        );
      } catch (error) {
        console.error('[hooks/typing-indicator] Error fetching typing users:', error);
      }
    };

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
          fetchTypingUsersForSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bugReportId, supabase]);

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
