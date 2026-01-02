'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageReactions } from './message-reactions';
import type { EnhancedBugReportMessage } from '@boobalan_jkkn/shared';
import { formatDistanceToNow } from 'date-fns';
import { FileIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: EnhancedBugReportMessage;
  isOwn: boolean;
  currentUserId?: string;
}

export function MessageBubble({ message, isOwn, currentUserId }: MessageBubbleProps) {
  const sender = message.sender as any;

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={sender?.avatar_url} />
        <AvatarFallback>
          {sender?.email?.[0]?.toUpperCase() || sender?.full_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {sender?.full_name || sender?.email || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        <div
          className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:underline group"
                >
                  <FileIcon className="h-3 w-3" />
                  <span className="flex-1 truncate">{attachment.file_name}</span>
                  {attachment.file_size && (
                    <span className="text-muted-foreground">
                      ({(attachment.file_size / 1024).toFixed(1)}KB)
                    </span>
                  )}
                  <Download className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1">
            <MessageReactions
              messageId={message.id}
              reactions={message.reactions}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
