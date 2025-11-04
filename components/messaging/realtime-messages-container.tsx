'use client';

import { useEffect, useRef } from 'react';
import { useRealtimeMessages } from '@/hooks/messaging/use-realtime-messages';
import { useTypingIndicator } from '@/hooks/messaging/use-typing-indicator';
import { useSendMessage } from '@/hooks/messaging/use-send-message';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { EnhancedMessageInput } from './enhanced-message-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RealtimeMessagesContainerProps {
  bugReportId: string;
  currentUserId?: string;
}

export function RealtimeMessagesContainer({
  bugReportId,
  currentUserId,
}: RealtimeMessagesContainerProps) {
  const { messages, loading, error } = useRealtimeMessages(bugReportId);
  const { typingUsers, setTyping } = useTypingIndicator(bugReportId);
  const { sendMessage, sending } = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: string, files: File[]) => {
    await sendMessage({
      bug_report_id: bugReportId,
      message,
      attachments: files.length > 0 ? files : undefined,
    });
  };

  const handleTypingChange = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading messages: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full max-w-md" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_user_id === currentUserId}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        <TypingIndicator typingUsers={typingUsers} />
      </CardContent>

      <EnhancedMessageInput
        bugReportId={bugReportId}
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        disabled={sending}
      />
    </Card>
  );
}
