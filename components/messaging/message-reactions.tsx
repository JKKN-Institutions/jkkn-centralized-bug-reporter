'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMessageReactions } from '@/hooks/messaging/use-message-reactions';
import type { MessageReaction } from '@boobalan_jkkn/shared';
import { Smile } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  currentUserId?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
}: MessageReactionsProps) {
  const { addReaction, removeReaction } = useMessageReactions();
  const [isOpen, setIsOpen] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.value || '';
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const handleEmojiClick = async (emoji: string) => {
    const existingReaction = reactions.find(
      (r) => r.value === emoji && r.user_id === currentUserId
    );

    if (existingReaction) {
      await removeReaction(existingReaction.id);
    } else {
      await addReaction(messageId, emoji);
    }

    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Display existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userReacted = reactionList.some((r) => r.user_id === currentUserId);

        return (
          <Button
            key={emoji}
            variant={userReacted ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleEmojiClick(emoji)}
          >
            <span className="mr-1">{emoji}</span>
            <span>{reactionList.length}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
