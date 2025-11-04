'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from './file-uploader';
import { Send } from 'lucide-react';

interface EnhancedMessageInputProps {
  bugReportId: string;
  onSend: (message: string, files: File[]) => Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function EnhancedMessageInput({
  bugReportId,
  onSend,
  onTypingChange,
  disabled = false,
}: EnhancedMessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessageChange = (value: string) => {
    setMessage(value);

    // Typing indicator logic
    if (value.length > 0) {
      onTypingChange(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 2000);
    } else {
      onTypingChange(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || sending) return;

    try {
      setSending(true);
      onTypingChange(false);
      await onSend(message.trim(), files);
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error('[EnhancedMessageInput] Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTypingChange(false);
    };
  }, [onTypingChange]);

  return (
    <div className="space-y-3 p-4 border-t bg-background">
      <FileUploader files={files} onFilesChange={setFiles} />

      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          disabled={disabled || sending}
          className="min-h-[60px] max-h-[120px] resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && files.length === 0)}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
