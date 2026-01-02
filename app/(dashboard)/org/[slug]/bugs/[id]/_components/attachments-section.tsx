'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Paperclip,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  File,
  X
} from 'lucide-react';
import type { Attachment } from '@boobalan_jkkn/shared';

interface AttachmentsSectionProps {
  attachments: Attachment[];
}

/**
 * Get icon based on file type
 */
function getFileIcon(filetype: string) {
  if (filetype.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (filetype === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (filetype.startsWith('text/')) {
    return <FileText className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if file is an image
 */
function isImage(filetype: string): boolean {
  return filetype.startsWith('image/');
}

export function AttachmentsSection({ attachments }: AttachmentsSectionProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>
            {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="group relative rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Image Preview */}
                {isImage(attachment.filetype) && attachment.url && (
                  <div
                    className="mb-3 cursor-pointer overflow-hidden rounded-md border bg-muted aspect-video flex items-center justify-center"
                    onClick={() => setPreviewImage(attachment.url!)}
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-start gap-3">
                  {getFileIcon(attachment.filetype)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={attachment.filename}>
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.filesize)} • {attachment.filetype.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {attachment.url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a
                          href={attachment.url}
                          download={attachment.filename}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[90vh] max-w-full mx-auto rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
