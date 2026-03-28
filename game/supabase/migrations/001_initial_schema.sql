-- Bounty Bear - Initial Schema
-- Run this in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
CREATE INDEX hunts_status_idx ON hunts (status) WHERE status = 'active';

-- CLAIMS
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID NOT NULL REFERENCES hunts(id) ON DELETE CASCADE,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL,
  verification_location GEOGRAPHY(POINT, 4326) NOT NULL,
  verification_proof JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  distance_from_target FLOAT NOT NULL,
  flags JSONB DEFAULT '[]'::jsonb,
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  review_status TEXT CHECK (review_status IN ('approved', 'rejected', 'pending')),
  review_notes TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX claims_hunter_idx ON claims (hunter_id);
CREATE INDEX claims_bounty_idx ON claims (bounty_id);
CREATE INDEX claims_claimed_at_idx ON claims (claimed_at DESC);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bounty_claimed', 'new_bounty_nearby', 'rank_up', 'achievement_unlocked', 'bounty_expiring', 'points_earned')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  bounty_id UUID REFERENCES bounties(id),
  hunt_id UUID REFERENCES hunts(id),
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications (user_id, is_read);
CREATE INDEX notifications_created_idx ON notifications (created_at DESC);

-- ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL,
  reward_points INTEGER DEFAULT 0,
  tier TEXT CHECK (tier IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX user_achievements_user_idx ON user_achievements (user_id);

-- LEADERBOARDS (cached)
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('global_hunters', 'global_creators', 'local', 'weekly')),
  period TEXT CHECK (period IN ('all_time', 'weekly', 'daily')),
  rankings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  UNIQUE (type, period)
);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(
    ST_MakePoint(lng1, lat1)::geography,
    ST_MakePoint(lng2, lat2)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION award_points(user_uuid UUID, amount INTEGER, reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET points = points + amount, total_earned = total_earned + amount
  WHERE id = user_uuid;

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (user_uuid, 'points_earned', 'Points Earned!', format('You earned %s points for %s', amount, reason));
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active bounties" ON bounties FOR SELECT USING (status = 'active' OR creator_id = auth.uid());
CREATE POLICY "Users can create bounties" ON bounties FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own bounties" ON bounties FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own hunts" ON hunts FOR SELECT USING (auth.uid() = hunter_id);
CREATE POLICY "Users can start hunts" ON hunts FOR INSERT WITH CHECK (auth.uid() = hunter_id);
CREATE POLICY "Users can update own active hunts" ON hunts FOR UPDATE USING (auth.uid() = hunter_id);

CREATE POLICY "Users can view own claims" ON claims FOR SELECT USING (auth.uid() = hunter_id);
CREATE POLICY "Users can submit claims" ON claims FOR INSERT WITH CHECK (auth.uid() = hunter_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- SEED: Achievements
INSERT INTO achievements (key, name, description, icon, criteria, reward_points, tier) VALUES
('first_claim', 'First Blood', 'Claim your first bounty', '🎯', '{"type": "claims_count", "target": 1}', 100, 'common'),
('speed_demon', 'Speed Demon', 'Claim a bounty within 5 minutes', '⚡', '{"type": "claim_speed", "max_seconds": 300}', 500, 'epic'),
('bounty_master', 'Bounty Master', 'Create 50 bounties', '👑', '{"type": "bounties_created", "target": 50}', 1000, 'legendary'),
('on_the_hunt', 'On The Hunt', 'Complete 10 bounties', '🐻', '{"type": "claims_count", "target": 10}', 250, 'rare');
