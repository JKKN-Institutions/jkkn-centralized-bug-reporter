/**
 * Supabase Storage Helper for Bug Report Attachments
 * Handles file uploads, deletions, and URL generation
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { Attachment } from '@boobalan_jkkn/shared';

// =============================================
// CONSTANTS
// =============================================

const STORAGE_BUCKET = 'bug-attachments';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'text/csv',
  // Logs
  'application/json',
  'text/x-log',
  'application/x-log'
] as const;

// =============================================
// TYPES
// =============================================

export interface UploadAttachmentOptions {
  applicationSlug: string;
  bugReportId: string;
  file: {
    filename: string;
    filesize: number;
    filetype: string;
    data_url: string; // Base64 data URL
  };
}

export interface UploadResult {
  success: boolean;
  attachment?: Attachment;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// =============================================
// VALIDATION
// =============================================

/**
 * Validate file before upload
 */
function validateFile(file: UploadAttachmentOptions['file']): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.filesize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.filetype as any)) {
    return {
      valid: false,
      error: `File type "${
        file.filetype
      }" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  // Check filename
  if (!file.filename || file.filename.length === 0) {
    return {
      valid: false,
      error: 'Filename is required'
    };
  }

  // Check for suspicious filenames
  if (
    file.filename.includes('..') ||
    file.filename.includes('/') ||
    file.filename.includes('\\')
  ) {
    return {
      valid: false,
      error: 'Invalid filename'
    };
  }

  return { valid: true };
}

/**
 * Convert base64 data URL to Buffer
 */
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; error?: string } {
  try {
    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return {
        buffer: Buffer.from([]),
        error: 'Invalid data URL format'
      };
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return { buffer };
  } catch (error) {
    return {
      buffer: Buffer.from([]),
      error: `Failed to parse data URL: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    };
  }
}

// =============================================
// STORAGE BUCKET INITIALIZATION
// =============================================

/**
 * Ensure the storage bucket exists (should be called during setup)
 */
export async function ensureBucketExists(): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('[Storage] Failed to list buckets:', listError);
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === STORAGE_BUCKET
    );

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(
        STORAGE_BUCKET,
        {
          public: true, // Files are publicly accessible via URL
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: [...ALLOWED_MIME_TYPES]
        }
      );

      if (createError) {
        console.error('[Storage] Failed to create bucket:', createError);
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`[Storage] Created bucket: ${STORAGE_BUCKET}`);
    }
  } catch (error) {
    console.error('[Storage] Bucket initialization error:', error);
    throw error;
  }
}

// =============================================
// FILE UPLOAD
// =============================================

/**
 * Upload attachment to Supabase Storage
 * Path structure: bug-attachments/{application_slug}/{bug_report_id}/{filename}
 */
export async function uploadAttachment(
  options: UploadAttachmentOptions
): Promise<UploadResult> {
  const { applicationSlug, bugReportId, file } = options;

  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Convert data URL to buffer
    const { buffer, error: conversionError } = dataUrlToBuffer(file.data_url);
    if (conversionError) {
      return {
        success: false,
        error: conversionError
      };
    }

    // Create file path
    const timestamp = Date.now();
    const sanitizedFilename = file.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${applicationSlug}/${bugReportId}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const supabase = createAdminClient();
    const { data, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.filetype,
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('[Storage] Upload failed:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('[Storage] Failed to get public URL');
      return {
        success: false,
        error: 'Failed to generate public URL'
      };
    }

    // Create attachment object
    const attachment: Attachment = {
      filename: file.filename,
      filesize: file.filesize,
      filetype: file.filetype,
      url: urlData.publicUrl
    };

    console.log(`[Storage] File uploaded successfully: ${filePath}`);

    return {
      success: true,
      attachment
    };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    return {
      success: false,
      error: `Upload error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    };
  }
}

/**
 * Upload multiple attachments
 */
export async function uploadAttachments(
  applicationSlug: string,
  bugReportId: string,
  files: UploadAttachmentOptions['file'][]
): Promise<{
  success: boolean;
  attachments: Attachment[];
  errors: string[];
}> {
  const attachments: Attachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadAttachment({
      applicationSlug,
      bugReportId,
      file
    });

    if (result.success && result.attachment) {
      attachments.push(result.attachment);
    } else if (result.error) {
      errors.push(`${file.filename}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    attachments,
    errors
  };
}

// =============================================
// FILE DELETION
// =============================================

/**
 * Delete attachment from Supabase Storage
 */
export async function deleteAttachment(
  applicationSlug: string,
  bugReportId: string,
  filename: string
): Promise<DeleteResult> {
  try {
    // Find the file path (need to list files to get full path with timestamp)
    const supabase = createAdminClient();
    const folderPath = `${applicationSlug}/${bugReportId}`;

    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath);

    if (listError) {
      console.error('[Storage] Failed to list files:', listError);
      return {
        success: false,
        error: `Failed to list files: ${listError.message}`
      };
    }

    // Find file matching the original filename
    const targetFile = files?.find((file) => file.name.endsWith(filename));

    if (!targetFile) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    const filePath = `${folderPath}/${targetFile.name}`;

    // Delete file
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.error('[Storage] Delete failed:', deleteError);
      return {
        success: false,
        error: `Delete failed: ${deleteError.message}`
      };
    }

    console.log(`[Storage] File deleted: ${filePath}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    return {
      success: false,
      error: `Delete error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    };
  }
}

/**
 * Delete all attachments for a bug report
 */
export async function deleteAllAttachments(
  applicationSlug: string,
  bugReportId: string
): Promise<DeleteResult> {
  try {
    const supabase = createAdminClient();
    const folderPath = `${applicationSlug}/${bugReportId}`;

    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath);

    if (listError) {
      console.error('[Storage] Failed to list files:', listError);
      return {
        success: false,
        error: `Failed to list files: ${listError.message}`
      };
    }

    if (!files || files.length === 0) {
      return { success: true }; // No files to delete
    }

    // Delete all files
    const filePaths = files.map((file) => `${folderPath}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('[Storage] Delete failed:', deleteError);
      return {
        success: false,
        error: `Delete failed: ${deleteError.message}`
      };
    }

    console.log(
      `[Storage] Deleted ${filePaths.length} files from ${folderPath}`
    );

    return {
      success: true
    };
  } catch (error) {
    console.error('[Storage] Delete all error:', error);
    return {
      success: false,
      error: `Delete error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get public URL for an attachment
 */
export function getAttachmentUrl(
  applicationSlug: string,
  bugReportId: string,
  filename: string
): string {
  const supabase = createAdminClient();
  const timestamp = Date.now(); // Note: This won't match the actual file
  const filePath = `${applicationSlug}/${bugReportId}/${timestamp}_${filename}`;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return data?.publicUrl || '';
}

/**
 * List all attachments for a bug report
 */
export async function listAttachments(
  applicationSlug: string,
  bugReportId: string
): Promise<{
  success: boolean;
  files: Array<{ name: string; size: number; url: string }>;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    const folderPath = `${applicationSlug}/${bugReportId}`;

    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath);

    if (listError) {
      console.error('[Storage] Failed to list files:', listError);
      return {
        success: false,
        files: [],
        error: `Failed to list files: ${listError.message}`
      };
    }

    if (!files) {
      return {
        success: true,
        files: []
      };
    }

    // Get public URLs for all files
    const fileList = files.map((file) => {
      const filePath = `${folderPath}/${file.name}`;
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        url: data?.publicUrl || ''
      };
    });

    return {
      success: true,
      files: fileList
    };
  } catch (error) {
    console.error('[Storage] List error:', error);
    return {
      success: false,
      files: [],
      error: `List error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    };
  }
}
