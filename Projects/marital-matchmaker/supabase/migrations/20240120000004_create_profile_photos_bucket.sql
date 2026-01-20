-- Migration: Create Storage Bucket for Profile Photos
-- Sets up secure storage for user profile photos with RLS policies

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,  -- Public bucket so photos can be viewed by other users
    5242880,  -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Users can upload photos to their own folder
CREATE POLICY "Users can upload own photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view all profile photos (public bucket for matching)
CREATE POLICY "Anyone can view profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
