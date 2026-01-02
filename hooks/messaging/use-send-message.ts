'use client';

import { useState } from 'react';
import { MessagingClientService } from '@/lib/services/messaging/client';
import type { SendMessagePayload } from '@boobalan_jkkn/shared';
import toast from 'react-hot-toast';

/**
 * Hook for sending messages with attachments
 */
export function useSendMessage() {
  const [sending, setSending] = useState(false);

  const sendMessage = async (payload: SendMessagePayload) => {
    try {
      setSending(true);
      const message = await MessagingClientService.sendMessage(payload);
      return message;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(message);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sending,
  };
}
