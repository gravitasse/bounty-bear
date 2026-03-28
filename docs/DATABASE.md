# Bounty Bear - Database Schema

## Overview

Supabase PostgreSQL with PostGIS extension for geospatial queries.

**Extensions Required:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS uuid-ossp; -- For UUID generation
```

## Schema Design

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- Game Stats
  points INTEGER DEFAULT 1000 NOT NULL CHECK (points >= 0),
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  reputation_level INTEGER DEFAULT 1 NOT NULL,

  -- Roles
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,

  -- Flags
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Settings
  settings JSONB DEFAULT '{
    "notifications": true,
    "sound_effects": true,
    "location_sharing": true
  }'::jsonb
);

-- Indexes
CREATE INDEX users_username_idx ON users (username);
CREATE INDEX users_points_idx ON users (points DESC);
CREATE INDEX users_last_active_idx ON users (last_active_at DESC);
CREATE INDEX users_premium_idx ON users (is_premium) WHERE is_premium = TRUE;
```

### Bounties Table

```sql
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Location (PostGIS)
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- WGS84 coordinate system
  location_name TEXT, -- "Golden Gate Bridge", "Central Park", etc.

  -- Reward & Status
  reward_points INTEGER NOT NULL CHECK (reward_points >= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),

  -- Clues (progressive unlock)
  clues JSONB NOT NULL, -- Array of {text, unlock_distance}
  /*
    Example:
    [
      {"text": "Near water and steel", "unlock_distance": null},
      {"text": "Red bridge, north side", "unlock_distance": 500},
      {"text": "Third bench from fountain", "unlock_distance": 100}
    ]
  */

  -- Verification
  verification_method TEXT NOT NULL CHECK (verification_method IN ('qr_code', 'photo', 'passcode')),
  verification_data JSONB NOT NULL,
  /*
    QR Code: {"qr_uuid": "...", "expires_at": "...", "signature": "..."}
    Photo: {"reference_image_url": "...", "similarity_threshold": 0.85}
    Passcode: {"passcode_hash": "...", "hint": "..."}
  */

  -- Analytics
  view_count INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0, -- How many hunters tried to claim

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX bounties_location_idx ON bounties USING GIST (location);
CREATE INDEX bounties_creator_idx ON bounties (creator_id);
CREATE INDEX bounties_status_idx ON bounties (status) WHERE status = 'active';
CREATE INDEX bounties_created_idx ON bounties (created_at DESC);
CREATE INDEX bounties_reward_idx ON bounties (reward_points DESC);

-- Spatial query example: Find bounties within 5km radius
-- SELECT * FROM bounties
-- WHERE ST_DWithin(
--   location,
--   ST_MakePoint(-122.4194, 37.7749)::geography,
--   5000 -- meters
-- )
-- AND status = 'active';
```

### Hunts Table

```sql
CREATE TABLE hunts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),

  -- Progress Tracking
  unlocked_clues INTEGER[] DEFAULT ARRAY[1], -- Which clue indexes are unlocked
  closest_distance FLOAT, -- Closest the hunter got (meters)

  -- Location History (for anti-cheat)
  location_history JSONB DEFAULT '[]'::jsonb,
  /*
    Example:
    [
      {"lat": 37.7749, "lng": -122.4194, "timestamp": "2026-03-27T10:00:00Z"},
      {"lat": 37.7750, "lng": -122.4195, "timestamp": "2026-03-27T10:05:00Z"}
    ]
  */

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Result
  verification_proof JSONB, -- QR data, photo URL, or passcode entered
  points_earned INTEGER,

  -- Unique constraint: One active hunt per user per bounty
  UNIQUE (bounty_id, hunter_id, status)
);

-- Indexes
CREATE INDEX hunts_bounty_idx ON hunts (bounty_id);
CREATE INDEX hunts_hunter_idx ON hunts (hunter_id);
CREATE INDEX hunts_status_idx ON hunts (status) WHERE status = 'active';
CREATE INDEX hunts_completed_idx ON hunts (completed_at DESC) WHERE status = 'completed';
```

### Claims Table

```sql
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID NOT NULL REFERENCES hunts(id) ON DELETE CASCADE,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Verification Details
  verification_method TEXT NOT NULL,
  verification_location GEOGRAPHY(POINT, 4326) NOT NULL, -- Where claim was made
  verification_proof JSONB NOT NULL, -- QR UUID, photo URL, passcode

  -- Validation Results
  is_valid BOOLEAN DEFAULT TRUE,
  distance_from_target FLOAT NOT NULL, -- Meters
  flags JSONB DEFAULT '[]'::jsonb, -- Anti-cheat flags
  /*
    Example flags:
    [
      {"type": "suspicious_velocity", "details": "Moved 500m in 10 seconds"},
      {"type": "gps_spoof_detected", "details": "Location jumped across city"}
    ]
  */

  -- Review (for flagged claims)
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  review_status TEXT CHECK (review_status IN ('approved', 'rejected', 'pending')),
  review_notes TEXT,

  -- Timestamps
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX claims_hunter_idx ON claims (hunter_id);
CREATE INDEX claims_bounty_idx ON claims (bounty_id);
CREATE INDEX claims_claimed_at_idx ON claims (claimed_at DESC);
CREATE INDEX claims_review_idx ON claims (requires_review) WHERE requires_review = TRUE;
```

### Leaderboards Table (Cached)

```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Leaderboard Types
  type TEXT NOT NULL CHECK (type IN ('global_hunters', 'global_creators', 'local', 'weekly')),
  period TEXT CHECK (period IN ('all_time', 'weekly', 'daily')),

  -- Geofence (for local leaderboards)
  location GEOGRAPHY(POINT, 4326),
  radius_km INTEGER DEFAULT 25,

  -- Rankings (denormalized for fast reads)
  rankings JSONB NOT NULL,
  /*
    Example:
    [
      {"rank": 1, "user_id": "...", "username": "...", "points": 15000},
      {"rank": 2, "user_id": "...", "username": "...", "points": 12000},
      ...
    ]
  */

  -- Cache Control
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),

  -- Unique per type/period/location
  UNIQUE (type, period, location)
);

-- Indexes
CREATE INDEX leaderboards_type_idx ON leaderboards (type, period);
CREATE INDEX leaderboards_location_idx ON leaderboards USING GIST (location);
CREATE INDEX leaderboards_expires_idx ON leaderboards (expires_at);
```

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification Content
  type TEXT NOT NULL CHECK (type IN (
    'bounty_claimed',
    'new_bounty_nearby',
    'rank_up',
    'achievement_unlocked',
    'bounty_expiring'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related Entities
  bounty_id UUID REFERENCES bounties(id),
  hunt_id UUID REFERENCES hunts(id),

  -- Metadata
  data JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX notifications_user_idx ON notifications (user_id, is_read);
CREATE INDEX notifications_created_idx ON notifications (created_at DESC);
```

### Achievements Table

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement Metadata
  key TEXT UNIQUE NOT NULL, -- "first_claim", "streak_7_days", etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Emoji or icon name

  -- Unlock Criteria
  criteria JSONB NOT NULL,
  /*
    Example:
    {
      "type": "claims_count",
      "target": 10,
      "description": "Claim 10 bounties"
    }
  */

  -- Rewards
  reward_points INTEGER DEFAULT 0,

  -- Rarity
  tier TEXT CHECK (tier IN ('common', 'rare', 'epic', 'legendary'))
);

-- User Achievements (junction table)
CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX user_achievements_user_idx ON user_achievements (user_id);
```

## Row-Level Security (RLS) Policies

### Users Table
```sql
-- Users can view all profiles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Bounties Table
```sql
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bounties"
  ON bounties FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create bounties"
  ON bounties FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can cancel own bounties"
  ON bounties FOR UPDATE
  USING (auth.uid() = creator_id AND status = 'active');
```

### Hunts Table
```sql
ALTER TABLE hunts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunts"
  ON hunts FOR SELECT
  USING (auth.uid() = hunter_id);

CREATE POLICY "Users can start hunts"
  ON hunts FOR INSERT
  WITH CHECK (auth.uid() = hunter_id);

CREATE POLICY "Users can update own active hunts"
  ON hunts FOR UPDATE
  USING (auth.uid() = hunter_id AND status = 'active');
```

### Claims Table
```sql
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON claims FOR SELECT
  USING (auth.uid() = hunter_id);

CREATE POLICY "Users can submit claims"
  ON claims FOR INSERT
  WITH CHECK (auth.uid() = hunter_id);

-- Admins can view all claims for moderation
CREATE POLICY "Admins can view all claims"
  ON claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );
```

## Database Functions

### Calculate Distance
```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lng1 FLOAT,
  lat2 FLOAT,
  lng2 FLOAT
) RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(
    ST_MakePoint(lng1, lat1)::geography,
    ST_MakePoint(lng2, lat2)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Update Leaderboard (Cron Job)
```sql
CREATE OR REPLACE FUNCTION update_leaderboard(
  leaderboard_type TEXT,
  leaderboard_period TEXT
) RETURNS VOID AS $$
DECLARE
  rankings_json JSONB;
BEGIN
  -- Calculate rankings based on type
  IF leaderboard_type = 'global_hunters' THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'rank', row_number,
        'user_id', id,
        'username', username,
        'points', total_earned
      )
    )
    INTO rankings_json
    FROM (
      SELECT id, username, total_earned,
             ROW_NUMBER() OVER (ORDER BY total_earned DESC) as row_number
      FROM users
      WHERE NOT is_banned
      LIMIT 100
    ) ranked;
  END IF;

  -- Upsert into leaderboards table
  INSERT INTO leaderboards (type, period, rankings, updated_at, expires_at)
  VALUES (
    leaderboard_type,
    leaderboard_period,
    rankings_json,
    NOW(),
    NOW() + INTERVAL '1 hour'
  )
  ON CONFLICT (type, period, location)
  DO UPDATE SET
    rankings = EXCLUDED.rankings,
    updated_at = NOW(),
    expires_at = NOW() + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

### Award Points (Transaction)
```sql
CREATE OR REPLACE FUNCTION award_points(
  user_uuid UUID,
  amount INTEGER,
  reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update user points
  UPDATE users
  SET points = points + amount,
      total_earned = total_earned + amount
  WHERE id = user_uuid;

  -- Check for level-up
  -- (Logic for reputation level calculation)

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    user_uuid,
    'points_earned',
    'Points Earned!',
    format('You earned %s points for %s', amount, reason)
  );
END;
$$ LANGUAGE plpgsql;
```

## Common Queries

### 1. Find Nearby Bounties
```sql
-- Get active bounties within 5km, ordered by proximity
SELECT
  b.id,
  b.reward_points,
  b.difficulty,
  b.location_name,
  ST_Distance(
    b.location,
    ST_MakePoint($2, $1)::geography -- $1 = lat, $2 = lng
  ) AS distance_meters,
  u.username AS creator_username,
  u.reputation_level AS creator_reputation
FROM bounties b
JOIN users u ON b.creator_id = u.id
WHERE
  b.status = 'active'
  AND ST_DWithin(
    b.location,
    ST_MakePoint($2, $1)::geography,
    5000 -- 5km radius
  )
ORDER BY distance_meters ASC
LIMIT 50;
```

### 2. Get User Profile with Stats
```sql
SELECT
  u.id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.points,
  u.reputation_level,
  u.is_premium,

  -- Bounty Stats
  COUNT(DISTINCT b.id) AS bounties_created,
  COUNT(DISTINCT CASE WHEN b.status = 'claimed' THEN b.id END) AS bounties_claimed_by_others,

  -- Hunt Stats
  COUNT(DISTINCT c.id) AS total_claims,
  SUM(c.points_earned) AS total_points_earned,

  -- Recent Activity
  MAX(c.claimed_at) AS last_claim_at
FROM users u
LEFT JOIN bounties b ON b.creator_id = u.id
LEFT JOIN claims c ON c.hunter_id = u.id
WHERE u.id = $1
GROUP BY u.id;
```

### 3. Check if User Can Claim Bounty
```sql
-- Validation checks before allowing claim
SELECT
  CASE
    WHEN b.status != 'active' THEN 'Bounty is not active'
    WHEN b.creator_id = $1 THEN 'Cannot claim own bounty'
    WHEN EXISTS (
      SELECT 1 FROM claims
      WHERE bounty_id = $2 AND hunter_id = $1
    ) THEN 'Already claimed this bounty'
    WHEN ST_Distance(
      b.location,
      ST_MakePoint($4, $3)::geography -- $3 = lat, $4 = lng
    ) > 10 THEN 'Too far from target (must be within 10m)'
    ELSE 'OK'
  END AS validation_result
FROM bounties b
WHERE b.id = $2;
```

### 4. Unlock Clue by Proximity
```sql
-- Get next locked clue if within unlock distance
UPDATE hunts
SET unlocked_clues = array_append(unlocked_clues, $2) -- $2 = clue index
WHERE
  id = $1
  AND $2 = ANY(unlocked_clues) = FALSE -- Not already unlocked
  AND EXISTS (
    SELECT 1 FROM bounties b
    WHERE b.id = bounty_id
    AND ST_Distance(
      b.location,
      ST_MakePoint($4, $3)::geography
    ) <= (b.clues->($2 - 1)->>'unlock_distance')::float
  )
RETURNING *;
```

## Migrations

### Initial Migration (v1)
```sql
-- Run this to set up the database from scratch
-- migrations/001_initial_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Create tables (see above)
-- Apply RLS policies (see above)
-- Create indexes (see above)
-- Create functions (see above)
```

### Seed Data (Development Only)
```sql
-- Sample achievements
INSERT INTO achievements (key, name, description, icon, criteria, reward_points, tier) VALUES
('first_claim', 'First Blood', 'Claim your first bounty', '🎯', '{"type": "claims_count", "target": 1}', 100, 'common'),
('speed_demon', 'Speed Demon', 'Claim a bounty within 5 minutes', '⚡', '{"type": "claim_speed", "max_seconds": 300}', 500, 'epic'),
('bounty_master', 'Bounty Master', 'Create 50 bounties', '👑', '{"type": "bounties_created", "target": 50}', 1000, 'legendary');
```

---

**Next Steps:** See [API.md](./API.md) for endpoint documentation.
