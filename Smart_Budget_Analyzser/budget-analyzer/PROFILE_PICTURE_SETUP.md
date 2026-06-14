# Profile Picture Feature Setup Guide

## Overview
This guide explains how to set up the Supabase Storage bucket and database migration for the profile picture feature.

---

## 1. Database Migration

### Run SQL Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add profile_url column to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "profile_url" TEXT;

-- Add comment to document the column
COMMENT ON COLUMN "public"."users"."profile_url" IS 'Supabase Storage URL for user profile picture';
```

**Migration file location:** `supabase_migration_profile_url.sql`

### Why This Column Is Safe
- The `profile_url` column is **nullable**, so existing users will have `NULL` by default
- **Login flow** remains unchanged - when users sign in, their profile_url is simply loaded from the database (NULL if not set)
- **Signup flow** remains unchanged - new users are created with `{ id, email, name }`, and `profile_url` defaults to NULL
- **No breaking changes** - all existing functionality continues to work

---

## 2. Supabase Storage Setup

### Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New Bucket"**
3. Configure bucket:
   - **Name:** `profile-pictures`
   - **Public:** ✅ **Yes** (enable public access)
   - **File size limit:** 5 MB (recommended)
   - **Allowed MIME types:** `image/jpeg, image/png, image/jpg, image/webp`

### Set Bucket Policies

After creating the bucket, set up the following policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

#### Policy 3: Allow Users to Update Their Own Pictures
```sql
CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Allow Users to Delete Their Own Pictures
```sql
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 3. Required NPM Package

The following package has already been installed:

```bash
npm install base64-arraybuffer
```

This package is required for converting image files to base64 for Supabase Storage upload.

---

## 4. How It Works

### Upload Flow
1. User taps profile picture → image picker opens
2. User selects image → cropped to 1:1 aspect ratio at 50% quality
3. Image is read as base64 string
4. Uploaded to Supabase Storage at path: `avatars/{userId}/profile.{ext}`
5. Public URL is generated
6. `users.profile_url` column is updated with the public URL
7. Profile picture is displayed immediately

### Load Flow
1. On login/app load, profile screen queries `users` table
2. If `profile_url` exists, the image is loaded from Supabase CDN
3. If `profile_url` is NULL, placeholder icon is shown

---

## 5. File Structure

```
Supabase Storage Bucket: profile-pictures/
└── avatars/
    ├── {userId1}/
    │   └── profile.jpg
    ├── {userId2}/
    │   └── profile.png
    └── {userId3}/
        └── profile.webp
```

Each user has their own folder, and the file is always named `profile.{ext}` (upsert mode enabled, so it replaces on re-upload).

---

## 6. Code Changes Summary

### Modified Files
- **`app/(tabs)/profile.tsx`**
  - Replaced `SecureStore` profile image storage with Supabase Storage upload
  - Added `loadProfileImage()` to fetch profile_url from users table
  - Added `uploadProfileImage()` to upload to Storage and update database

### Dependencies Added
- `expo-file-system` (already in project)
- `base64-arraybuffer` (newly installed)
- `@supabase/supabase-js` (already in project)

---

## 7. Testing Checklist

After completing the setup:

- [ ] Run SQL migration to add `profile_url` column
- [ ] Create `profile-pictures` bucket in Supabase Storage
- [ ] Set bucket to **public**
- [ ] Add all 4 storage policies
- [ ] Test login - should work without errors
- [ ] Test signup - should work without errors
- [ ] Test profile picture upload in app
- [ ] Verify image appears in Supabase Storage bucket
- [ ] Verify `profile_url` column is updated in `users` table
- [ ] Verify image loads on next login

---

## 8. Troubleshooting

### Upload Error: "Bucket not found"
→ Ensure bucket name is exactly `profile-pictures` (check spelling)

### Upload Error: "Permission denied"
→ Verify all 4 storage policies are created and bucket is public

### Image doesn't load after upload
→ Check Supabase logs → ensure `profile_url` was saved to database
→ Verify public URL is accessible in browser

### "base64-arraybuffer" module not found
→ Run: `npm install base64-arraybuffer`

---

## 9. Security Notes

- Users can only upload/update/delete **their own** profile pictures (enforced by storage policies)
- All profile pictures are **publicly accessible** via CDN URL (this is intentional for displaying in the app)
- Files are limited to 5 MB to prevent abuse
- Image quality is reduced to 50% to minimize storage costs
