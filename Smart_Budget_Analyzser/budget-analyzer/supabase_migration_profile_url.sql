-- Migration: Add profile_url column to users table
-- This column stores the Supabase Storage URL for user profile pictures
-- Adding as nullable column so existing users are not affected

-- Add profile_url column to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "profile_url" TEXT;

-- Add comment to document the column
COMMENT ON COLUMN "public"."users"."profile_url" IS 'Supabase Storage URL for user profile picture';

-- Optional: Create index for faster lookups (if you frequently query by profile_url)
CREATE INDEX IF NOT EXISTS idx_users_profile_url ON "public"."users"("profile_url");

-- Verify the column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'profile_url';
