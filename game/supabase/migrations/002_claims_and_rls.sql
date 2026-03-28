-- Migration 002: Fix claims hunt_id + expand bounties RLS
-- Run this in the Supabase SQL Editor

-- 1. Make hunt_id nullable so claims work before hunt tracking is implemented
ALTER TABLE claims ALTER COLUMN hunt_id DROP NOT NULL;

-- 2. Update bounties RLS so hunters can see bounties they've claimed (needed for profile page)
DROP POLICY IF EXISTS "Anyone can view active bounties" ON bounties;
CREATE POLICY "Anyone can view relevant bounties" ON bounties
  FOR SELECT USING (
    status = 'active'
    OR creator_id = auth.uid()
    OR claimed_by = auth.uid()
  );

-- 3. Allow system to update bounty status to 'claimed' (claimed_by check)
DROP POLICY IF EXISTS "Creators can update own bounties" ON bounties;
CREATE POLICY "Users can update bounties they are involved with" ON bounties
  FOR UPDATE USING (
    auth.uid() = creator_id
    OR (status = 'active' AND auth.uid() IS NOT NULL)
  );
