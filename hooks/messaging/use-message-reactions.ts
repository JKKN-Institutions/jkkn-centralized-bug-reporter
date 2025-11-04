'use client';

import { useState } from 'react';
import { MessagingClientService } from '@/lib/services/messaging/client';
import toast from 'react-hot-toast';

/**
 * Hook for managing message reactions
 */
export function useMessageReactions() {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      setAdding(true);
      await MessagingClientService.addReaction(messageId, emoji);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add reaction';
      toast.error(message);
      throw err;
    } finally {
      setAdding(false);
    }
  };

  const removeReaction = async (reactionId: string) => {
    try {
      setRemoving(true);
      await MessagingClientService.removeReaction(reactionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove reaction';
      toast.error(message);
      throw err;
    } finally {
      setRemoving(false);
    }
  };

  return {
    addReaction,
    removeReaction,
    adding,
    removing,
  };
}
