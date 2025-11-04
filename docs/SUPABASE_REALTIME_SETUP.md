# Supabase Realtime & Storage Setup Instructions

This document provides step-by-step instructions to configure Supabase Realtime and Storage for the Messaging Module.

---

## 1. Enable Realtime for Tables

Supabase Realtime needs to be enabled for the messaging tables to allow live updates.

### Via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Database** → **Replication**
4. Enable replication for these tables:
   - `bug_report_messages`
   - `bug_report_message_metadata`
   - `bug_report_typing`

### Via SQL (Alternative)

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable realtime for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE bug_report_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE bug_report_message_metadata;
ALTER PUBLICATION supabase_realtime ADD TABLE bug_report_typing;
```

**Verification:**
```sql
-- Check which tables have realtime enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

---

## 2. Create Storage Bucket for Attachments

A storage bucket is needed to store message attachments (images, PDFs, etc.).

### Via Supabase Dashboard

1. Navigate to **Storage** in the Supabase Dashboard
2. Click **New bucket**
3. Set the following:
   - **Name:** `bug-attachments`
   - **Public bucket:** Yes ✓ (allows direct file access)
   - **File size limit:** 10 MB (recommended)
   - **Allowed MIME types:** Leave empty for all types, or specify:
     - `image/*` (all images)
     - `application/pdf`
     - `text/*`

4. Click **Create bucket**

### Configure Storage Policies

After creating the bucket, set up RLS policies for secure access:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bug-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM bug_report_messages
    WHERE sender_user_id = auth.uid()
  )
);
```

#### Policy 2: Allow organization members to view
```sql
CREATE POLICY "Organization members can view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bug-attachments' AND
  EXISTS (
    SELECT 1 FROM bug_report_messages brm
    JOIN bug_reports br ON brm.bug_report_id = br.id
    JOIN organization_members om ON br.organization_id = om.organization_id
    WHERE brm.id::text = (storage.foldername(name))[1]
    AND om.user_id = auth.uid()
  )
);
```

#### Policy 3: Allow message sender to delete
```sql
CREATE POLICY "Message senders can delete their attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bug-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM bug_report_messages
    WHERE sender_user_id = auth.uid()
  )
);
```

---

## 3. Configure CORS (If Needed)

If you're uploading from a custom domain, configure CORS:

### Via Dashboard
1. Go to **Settings** → **API**
2. Scroll to **CORS**
3. Add your domain(s) to the allowed origins

### Via SQL
```sql
-- Usually not needed as Supabase handles this automatically
```

---

## 4. Verify Configuration

### Test Realtime Subscription

Use the Supabase JavaScript client in your browser console:

```javascript
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bug_report_messages'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Should log: "Subscribed to channel"
```

### Test File Upload

```javascript
const file = new File(['test'], 'test.txt', { type: 'text/plain' })
const { data, error } = await supabase.storage
  .from('bug-attachments')
  .upload('test/test.txt', file)

console.log('Upload result:', { data, error })
```

---

## 5. Environment Variables

Ensure your `.env.local` has the correct keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from: **Supabase Dashboard → Settings → API**

---

## Troubleshooting

### Realtime not working
- ✅ Check if tables are in the replication list
- ✅ Verify RLS policies allow the user to SELECT from the table
- ✅ Check browser console for connection errors
- ✅ Ensure Supabase client is initialized correctly

### File upload fails
- ✅ Check bucket exists and is public
- ✅ Verify file size is under limit
- ✅ Check RLS policies for storage
- ✅ Ensure user is authenticated

### Permission denied errors
- ✅ Review RLS policies on tables
- ✅ Check storage policies
- ✅ Verify user is member of organization
- ✅ Check user authentication status

---

## Quick Setup Checklist

- [ ] Enable Realtime for `bug_report_messages`
- [ ] Enable Realtime for `bug_report_message_metadata`
- [ ] Enable Realtime for `bug_report_typing`
- [ ] Create `bug-attachments` storage bucket
- [ ] Set bucket as public
- [ ] Add storage RLS policies (3 policies)
- [ ] Test Realtime subscription
- [ ] Test file upload
- [ ] Verify environment variables

---

**Estimated Setup Time:** 10-15 minutes

**Status after setup:** Messaging module 100% functional with real-time updates and file attachments! ✅
