-- Bounty Bear - FRESH START (Secured & Hardened Foundation)
-- WARNING: This will drop ALL data in the project tables.
-- Run this in the Supabase SQL Editor.

-------------------------------------------------------------------------------
-- 1. CLEANUP (Nuclear)
-------------------------------------------------------------------------------
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS hunts CASCADE;
DROP TABLE IF EXISTS bounties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop trigger first to avoid conflicts from previous failed runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS award_points(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(FLOAT, FLOAT, FLOAT, FLOAT) CASCADE;

-- Cleanup extensions from public if they exist there
DROP EXTENSION IF EXISTS postgis CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-------------------------------------------------------------------------------
-- 2. SETUP (Extensions in dedicated schema)
-------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move search_path warnings to history by isolating extensions
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Ensure functions and types are always findable while keeping search_path secure
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
SET search_path TO "$user", public, extensions;

-------------------------------------------------------------------------------
-- 3. TABLES (Consolidated & Complete)
-------------------------------------------------------------------------------

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 1000 NOT NULL CHECK (points >= 0),
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  reputation_level INTEGER DEFAULT 1 NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
  is_premium BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{"notifications": true, "sound_effects": true, "location_sharing": true}'::jsonb
);

CREATE INDEX users_username_idx ON users (username);
CREATE INDEX users_points_idx ON users (points DESC);
CREATE INDEX users_last_active_idx ON users (last_active_at DESC);

-- BOUNTIES
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name TEXT,
  reward_points INTEGER NOT NULL CHECK (reward_points >= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  clues JSONB NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('qr_code', 'photo', 'passcode')),
  verification_data JSONB NOT NULL,
  view_count INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES users(id)
);

CREATE INDEX bounties_location_idx ON bounties USING GIST (location);
CREATE INDEX bounties_creator_idx ON bounties (creator_id);
CREATE INDEX bounties_status_idx ON bounties (status) WHERE status = 'active';
CREATE INDEX bounties_created_idx ON bounties (created_at DESC);
CREATE INDEX bounties_reward_idx ON bounties (reward_points DESC);

-- HUNTS
CREATE TABLE hunts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  unlocked_clues INTEGER[] DEFAULT ARRAY[1],
  closest_distance FLOAT,
  location_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  verification_proof JSONB,
  points_earned INTEGER,
  UNIQUE (bounty_id, hunter_id, status)
);

CREATE INDEX hunts_bounty_idx ON hunts (bounty_id);
CREATE INDEX hunts_hunter_idx ON hunts (hunter_id);

-- CLAIMS
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL,
  verification_location GEOGRAPHY(POINT, 4326) NOT NULL,
  verification_proof JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  distance_from_target FLOAT NOT NULL,
  flags JSONB DEFAULT '[]'::jsonb,
  requires_review BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bounty_claimed', 'new_bounty_nearby', 'rank_up', 'achievement_unlocked', 'bounty_expiring', 'points_earned')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_points INTEGER DEFAULT 0,
  tier TEXT CHECK (tier IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-------------------------------------------------------------------------------
-- 4. HARDENED FUNCTIONS (Security Definer + Search Path Set)
-------------------------------------------------------------------------------

-- 1. Distance Calculation (IMMUTABLE)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
  RETURN extensions.ST_Distance(
    extensions.ST_MakePoint(lng1, lat1)::geography,
    extensions.ST_MakePoint(lng2, lat2)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = '';

-- 2. Point Awarding
CREATE OR REPLACE FUNCTION award_points(user_uuid UUID, amount INTEGER, reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET points = points + amount, total_earned = total_earned + amount
  WHERE id = user_uuid;

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (user_uuid, 'points_earned', 'Points Earned!', format('You earned %s points for %s', amount, reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. New User Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-------------------------------------------------------------------------------
-- 5. RLS POLICIES
-------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Bounties
CREATE POLICY "Anyone can view relevant bounties" ON bounties
  FOR SELECT USING (
    status = 'active'
    OR creator_id = auth.uid()
    OR claimed_by = auth.uid()
  );
CREATE POLICY "Users can create bounties" ON bounties FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update bounties they are involved with" ON bounties
  FOR UPDATE USING (
    auth.uid() = creator_id
    OR (status = 'active' AND auth.uid() IS NOT NULL)
  );

-- Hunts
CREATE POLICY "Users can view own hunts" ON hunts FOR SELECT USING (auth.uid() = hunter_id);
CREATE POLICY "Users can start hunts" ON hunts FOR INSERT WITH CHECK (auth.uid() = hunter_id);
CREATE POLICY "Users can update own active hunts" ON hunts FOR UPDATE USING (auth.uid() = hunter_id);

-- Claims
CREATE POLICY "Users can view own claims" ON claims FOR SELECT USING (auth.uid() = hunter_id);
CREATE POLICY "Users can submit claims" ON claims FOR INSERT WITH CHECK (auth.uid() = hunter_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 6. SEED DATA
-------------------------------------------------------------------------------
INSERT INTO achievements (key, name, description, reward_points, tier) VALUES
('first_claim', 'First Blood', 'Claim your first bounty', 100, 'common'),
('speed_demon', 'Speed Demon', 'Claim a bounty within 5 minutes', 500, 'epic'),
('on_the_hunt', 'On The Hunt', 'Complete 10 bounties', 250, 'rare');
