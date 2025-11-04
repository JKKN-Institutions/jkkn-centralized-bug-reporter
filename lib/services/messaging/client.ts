'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  EnhancedBugReportMessage,
  MessageAttachment,
  MessageReaction,
  SendMessagePayload,
} from '@bug-reporter/shared';

export class MessagingClientService {
  /**
   * Send message with optional attachments
   */
  static async sendMessage(payload: SendMessagePayload): Promise<EnhancedBugReportMessage> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Create message
      const { data: newMessage, error: messageError } = await supabase
        .from('bug_report_messages')
        .insert([
          {
            bug_report_id: payload.bug_report_id,
            sender_user_id: user.id,
            message_text: payload.message,
          },
        ])
        .select(
          `
          *,
          sender:profiles!sender_user_id(id, email, full_name, avatar_url)
        `
        )
        .single();

      if (messageError) throw messageError;

      // Upload attachments if any
      let attachments: MessageAttachment[] = [];
      if (payload.attachments && payload.attachments.length > 0) {
        attachments = await this.uploadAttachments(newMessage.id, payload.attachments);
      }

      console.log(`[MessagingClientService] Sent message on bug ${payload.bug_report_id}`);
      return { ...newMessage, attachments };
    } catch (error) {
      console.error('[MessagingClientService] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Upload message attachments to Supabase Storage
   */
  static async uploadAttachments(
    messageId: string,
    files: File[]
  ): Promise<MessageAttachment[]> {
    try {
      const supabase = createClient();
      const attachments: MessageAttachment[] = [];

      for (const file of files) {
        // Upload file to Supabase Storage
        const fileName = `${messageId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bug-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('[MessagingClientService] Upload error:', uploadError);
          continue; // Skip this file but continue with others
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('bug-attachments').getPublicUrl(fileName);

        // Save attachment metadata
        const { data: attachment, error: attachmentError } = await supabase
          .from('bug_report_message_attachments')
          .insert([
            {
              message_id: messageId,
              file_url: publicUrl,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            },
          ])
          .select()
          .single();

        if (attachmentError) {
          console.error('[MessagingClientService] Attachment metadata error:', attachmentError);
          continue;
        }

        attachments.push(attachment);
      }

      console.log(`[MessagingClientService] Uploaded ${attachments.length} attachments`);
      return attachments;
    } catch (error) {
      console.error('[MessagingClientService] Error uploading attachments:', error);
      throw error;
    }
  }

  /**
   * Get enhanced messages with attachments and reactions
   */
  static async getEnhancedMessages(
    bugReportId: string
  ): Promise<EnhancedBugReportMessage[]> {
    try {
      const supabase = createClient();

      const { data: messages, error } = await supabase
        .from('bug_report_messages')
        .select(
          `
          *,
          sender:profiles!sender_user_id(id, email, full_name, avatar_url),
          attachments:bug_report_message_attachments(*),
          reactions:bug_report_message_metadata!message_id(*)
        `
        )
        .eq('bug_report_id', bugReportId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(
        `[MessagingClientService] Fetched ${messages?.length || 0} enhanced messages`
      );
      return messages || [];
    } catch (error) {
      console.error('[MessagingClientService] Error fetching enhanced messages:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bug_report_message_metadata')
        .insert([
          {
            message_id: messageId,
            user_id: user.id,
            type: 'reaction',
            value: emoji,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log(`[MessagingClientService] Added reaction to message ${messageId}`);
      return data;
    } catch (error) {
      console.error('[MessagingClientService] Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  static async removeReaction(reactionId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('bug_report_message_metadata')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;

      console.log(`[MessagingClientService] Removed reaction ${reactionId}`);
    } catch (error) {
      console.error('[MessagingClientService] Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string): Promise<void> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error } = await supabase.from('bug_report_message_metadata').upsert(
        {
          message_id: messageId,
          user_id: user.id,
          type: 'read',
        },
        {
          onConflict: 'message_id,user_id,type,value',
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error('[MessagingClientService] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Set typing indicator
   */
  static async setTyping(bugReportId: string, isTyping: boolean): Promise<void> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      if (isTyping) {
        await supabase
          .from('bug_report_typing')
          .upsert(
            {
              bug_report_id: bugReportId,
              user_id: user.id,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'bug_report_id,user_id',
            }
          );
      } else {
        await supabase
          .from('bug_report_typing')
          .delete()
          .eq('bug_report_id', bugReportId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('[MessagingClientService] Error setting typing indicator:', error);
      throw error;
    }
  }

  /**
   * Get typing users for a bug report
   */
  static async getTypingUsers(bugReportId: string): Promise<any[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('bug_report_typing')
        .select(
          `
          user_id,
          user:profiles!user_id(email, full_name)
        `
        )
        .eq('bug_report_id', bugReportId)
        .gte('updated_at', new Date(Date.now() - 10000).toISOString()); // Last 10 seconds

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[MessagingClientService] Error fetching typing users:', error);
      throw error;
    }
  }
}
