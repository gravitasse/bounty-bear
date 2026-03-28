# Bounty Bear - API Documentation

## Base URL
```
Production: https://bounty-bear.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All endpoints require JWT authentication via Supabase Auth.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Getting a Token:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
const token = data.session.access_token;
```

## Rate Limiting

- **Free Users**: 100 requests/minute
- **Premium Users**: 500 requests/minute
- **Response Header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "BOUNTY_NOT_FOUND",
    "message": "Bounty with ID 'abc-123' does not exist",
    "details": {}
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - Invalid/missing JWT token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Bounties

### Create Bounty

**POST** `/bounties/create`

Create a new bounty at a GPS location.

**Request Body:**
```json
{
  "location": {
    "lat": 37.7749,
    "lng": -122.4194,
    "name": "Golden Gate Bridge Viewpoint"
  },
  "reward_points": 500,
  "difficulty": 3,
  "clues": [
    {
      "text": "Where water meets steel",
      "unlock_distance": null
    },
    {
      "text": "Red bridge, north side",
      "unlock_distance": 500
    },
    {
      "text": "Third bench from the fountain",
      "unlock_distance": 100
    }
  ],
  "verification_method": "qr_code",
  "expires_in_days": 7
}
```

**Response (201):**
```json
{
  "bounty": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "location": {
      "lat": 37.7749,
      "lng": -122.4194,
      "name": "Golden Gate Bridge Viewpoint"
    },
    "reward_points": 500,
    "difficulty": 3,
    "status": "active",
    "clues": [...],
    "verification_data": {
      "qr_uuid": "abc-123-def",
      "qr_url": "https://storage.supabase.co/bounty-bear/qr/abc-123.png",
      "expires_at": "2026-04-03T00:00:00Z"
    },
    "created_at": "2026-03-27T10:00:00Z",
    "expires_at": "2026-04-03T10:00:00Z"
  }
}
```

**Validation:**
- `reward_points`: Min 100, max 10,000 (or user's balance)
- `difficulty`: 1-5 (integer)
- `clues`: Min 3, max 10 clues
- User must have sufficient points balance

---

### Get Nearby Bounties

**GET** `/bounties/nearby?lat={lat}&lng={lng}&radius={km}`

Get active bounties within a radius.

**Query Parameters:**
- `lat` (required): Latitude (float)
- `lng` (required): Longitude (float)
- `radius` (optional): Radius in km (default: 5, max: 25)
- `min_reward` (optional): Filter by minimum reward points
- `max_reward` (optional): Filter by maximum reward points
- `difficulty` (optional): Filter by difficulty (1-5)
- `limit` (optional): Results limit (default: 50, max: 100)

**Response (200):**
```json
{
  "bounties": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "location_name": "Golden Gate Bridge Viewpoint",
      "reward_points": 500,
      "difficulty": 3,
      "distance_meters": 1234.56,
      "creator": {
        "username": "bounty_master",
        "reputation_level": 5
      },
      "clues_count": 3,
      "view_count": 42,
      "created_at": "2026-03-27T10:00:00Z",
      "expires_at": "2026-04-03T10:00:00Z"
    }
  ],
  "count": 12,
  "user_location": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

---

### Get Bounty Details

**GET** `/bounties/:id`

Get full details for a specific bounty.

**Response (200):**
```json
{
  "bounty": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "location": {
      "lat": 37.7749,
      "lng": -122.4194,
      "name": "Golden Gate Bridge Viewpoint"
    },
    "reward_points": 500,
    "difficulty": 3,
    "status": "active",
    "clues": [
      {
        "text": "Where water meets steel",
        "unlock_distance": null,
        "is_unlocked": true
      },
      {
        "text": "Red bridge, north side",
        "unlock_distance": 500,
        "is_unlocked": false
      },
      {
        "text": "Third bench from the fountain",
        "unlock_distance": 100,
        "is_unlocked": false
      }
    ],
    "verification_method": "qr_code",
    "creator": {
      "id": "...",
      "username": "bounty_master",
      "reputation_level": 5
    },
    "stats": {
      "view_count": 42,
      "attempt_count": 7
    },
    "created_at": "2026-03-27T10:00:00Z",
    "expires_at": "2026-04-03T10:00:00Z"
  }
}
```

**Note:** `clues[].is_unlocked` depends on user's current hunt progress.

---

### Cancel Bounty

**DELETE** `/bounties/:id`

Cancel an active bounty (creator only). Refunds reward points.

**Response (200):**
```json
{
  "message": "Bounty cancelled successfully",
  "refunded_points": 500
}
```

**Errors:**
- `403 FORBIDDEN` - Not the bounty creator
- `400 VALIDATION_ERROR` - Bounty already claimed/expired

---

## Hunts

### Start Hunt

**POST** `/hunts/start`

Accept a bounty and start hunting.

**Request Body:**
```json
{
  "bounty_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_location": {
    "lat": 37.7800,
    "lng": -122.4200
  }
}
```

**Response (201):**
```json
{
  "hunt": {
    "id": "hunt-uuid",
    "bounty_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "unlocked_clues": [1],
    "distance_to_target": 567.89,
    "started_at": "2026-03-27T11:00:00Z"
  },
  "first_clue": {
    "text": "Where water meets steel",
    "unlock_distance": null
  }
}
```

**Validation:**
- User cannot hunt own bounties
- User can only have 1 active hunt at a time
- Bounty must be active

---

### Get Active Hunts

**GET** `/hunts/active`

Get user's currently active hunts.

**Response (200):**
```json
{
  "hunts": [
    {
      "id": "hunt-uuid",
      "bounty": {
        "id": "bounty-uuid",
        "location_name": "Golden Gate Bridge",
        "reward_points": 500,
        "difficulty": 3
      },
      "status": "active",
      "unlocked_clues": [1, 2],
      "next_unlock_distance": 100,
      "closest_distance": 234.56,
      "current_distance": 456.78,
      "started_at": "2026-03-27T11:00:00Z"
    }
  ]
}
```

---

### Unlock Clue

**POST** `/hunts/:hunt_id/unlock-clue`

Attempt to unlock the next clue based on proximity.

**Request Body:**
```json
{
  "current_location": {
    "lat": 37.7755,
    "lng": -122.4198
  }
}
```

**Response (200):**
```json
{
  "clue_unlocked": true,
  "clue": {
    "index": 2,
    "text": "Red bridge, north side",
    "unlock_distance": 500
  },
  "distance_to_target": 234.56,
  "next_unlock_distance": 100
}
```

**Response (200) - Not close enough:**
```json
{
  "clue_unlocked": false,
  "distance_to_target": 678.90,
  "next_unlock_distance": 500,
  "message": "Get within 500m to unlock the next clue"
}
```

---

### Verify and Claim

**POST** `/hunts/:hunt_id/verify`

Submit verification to claim the bounty.

**Request Body (QR Code):**
```json
{
  "verification_method": "qr_code",
  "verification_data": {
    "qr_uuid": "abc-123-def"
  },
  "current_location": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

**Request Body (Photo):**
```json
{
  "verification_method": "photo",
  "verification_data": {
    "photo_base64": "data:image/jpeg;base64,..."
  },
  "current_location": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

**Response (200) - Success:**
```json
{
  "success": true,
  "claim": {
    "id": "claim-uuid",
    "bounty_id": "bounty-uuid",
    "points_earned": 500,
    "distance_from_target": 5.67,
    "claimed_at": "2026-03-27T12:00:00Z"
  },
  "user": {
    "points": 2450,
    "total_earned": 3500,
    "reputation_level": 3,
    "level_up": false
  },
  "message": "I GOT HIM! THIS IS YOUR GUY! FINDERS FEE: 500 POINTS"
}
```

**Response (400) - Validation Failed:**
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Too far from target location",
    "details": {
      "distance_from_target": 45.67,
      "max_allowed_distance": 10
    }
  }
}
```

**Validation:**
- Must be within 10m of target location
- QR code must be valid and not expired
- Photo similarity must exceed threshold (85%)
- Passcode must match hash
- Bounty must still be active

---

## Users

### Get Profile

**GET** `/users/profile`

Get the authenticated user's profile and stats.

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "username": "hunter_pro",
    "display_name": "Hunter Pro",
    "avatar_url": "https://...",
    "email": "user@example.com",
    "points": 2450,
    "total_earned": 5000,
    "total_spent": 2550,
    "reputation_level": 3,
    "is_premium": false,
    "created_at": "2026-01-01T00:00:00Z",
    "last_active_at": "2026-03-27T12:00:00Z"
  },
  "stats": {
    "bounties_created": 5,
    "bounties_claimed_by_others": 3,
    "total_claims": 12,
    "success_rate": 0.75,
    "average_claim_time_minutes": 45,
    "total_distance_traveled_km": 23.4,
    "achievements_unlocked": 7
  },
  "leaderboard_position": {
    "global": 142,
    "local": 8
  }
}
```

---

### Update Profile

**PATCH** `/users/profile`

Update user profile information.

**Request Body:**
```json
{
  "display_name": "New Name",
  "avatar_url": "https://...",
  "settings": {
    "notifications": true,
    "sound_effects": false,
    "location_sharing": true
  }
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "username": "hunter_pro",
    "display_name": "New Name",
    "avatar_url": "https://...",
    "settings": {...}
  }
}
```

---

### Get Public Profile

**GET** `/users/:username`

Get another user's public profile.

**Response (200):**
```json
{
  "user": {
    "username": "bounty_master",
    "display_name": "Bounty Master",
    "avatar_url": "https://...",
    "reputation_level": 5,
    "created_at": "2025-06-01T00:00:00Z"
  },
  "stats": {
    "bounties_created": 45,
    "bounties_claimed_by_others": 38,
    "average_bounty_claim_time_hours": 48,
    "achievements_unlocked": 15
  },
  "recent_achievements": [
    {
      "key": "bounty_master",
      "name": "Bounty Master",
      "icon": "👑",
      "unlocked_at": "2026-03-20T00:00:00Z"
    }
  ]
}
```

---

## Leaderboards

### Get Leaderboard

**GET** `/leaderboard?type={type}&period={period}`

Get leaderboard rankings.

**Query Parameters:**
- `type`: `global_hunters` | `global_creators` | `local` | `weekly` (default: `global_hunters`)
- `period`: `all_time` | `weekly` | `daily` (default: `all_time`)
- `lat`, `lng`: Required for `type=local`
- `limit`: Results limit (default: 100, max: 1000)

**Response (200):**
```json
{
  "leaderboard": {
    "type": "global_hunters",
    "period": "all_time",
    "updated_at": "2026-03-27T12:00:00Z"
  },
  "rankings": [
    {
      "rank": 1,
      "user": {
        "id": "user-uuid",
        "username": "top_hunter",
        "avatar_url": "https://...",
        "reputation_level": 10
      },
      "points": 50000,
      "claims_count": 124
    },
    {
      "rank": 2,
      "user": {...},
      "points": 45000,
      "claims_count": 118
    }
  ],
  "current_user_rank": {
    "rank": 142,
    "points": 2450
  }
}
```

---

## Activity Feed

### Get Activity

**GET** `/activity-feed?lat={lat}&lng={lng}&radius={km}`

Get recent bounty activity in an area.

**Query Parameters:**
- `lat`, `lng`: Center coordinates
- `radius`: Radius in km (default: 25, max: 100)
- `limit`: Results limit (default: 50, max: 200)
- `since`: ISO timestamp (only show activity after this time)

**Response (200):**
```json
{
  "activities": [
    {
      "id": "activity-uuid",
      "type": "bounty_claimed",
      "timestamp": "2026-03-27T11:30:00Z",
      "bounty": {
        "id": "bounty-uuid",
        "location_name": "Golden Gate Bridge",
        "reward_points": 500
      },
      "user": {
        "username": "hunter_pro",
        "reputation_level": 3
      },
      "distance_from_you": 2345.67,
      "message": "Hunter_pro claimed a 500-point bounty at Golden Gate Bridge"
    },
    {
      "id": "activity-uuid",
      "type": "bounty_created",
      "timestamp": "2026-03-27T10:00:00Z",
      "bounty": {
        "id": "bounty-uuid",
        "location_name": "Alcatraz Island",
        "reward_points": 1000,
        "difficulty": 5
      },
      "user": {
        "username": "bounty_master",
        "reputation_level": 8
      },
      "distance_from_you": 4567.89,
      "message": "Bounty_master created a legendary 1000-point bounty!"
    }
  ],
  "count": 24
}
```

---

## Notifications

### Get Notifications

**GET** `/notifications?unread_only={bool}`

Get user's notifications.

**Query Parameters:**
- `unread_only`: `true` | `false` (default: `false`)
- `limit`: Results limit (default: 50, max: 200)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "bounty_claimed",
      "title": "Your Bounty Was Claimed!",
      "message": "Hunter_pro claimed your 500-point bounty at Golden Gate Bridge",
      "bounty_id": "bounty-uuid",
      "is_read": false,
      "created_at": "2026-03-27T11:30:00Z"
    },
    {
      "id": "notif-uuid",
      "type": "new_bounty_nearby",
      "title": "New Bounty Nearby!",
      "message": "A 1000-point legendary bounty appeared 2.3km away",
      "bounty_id": "bounty-uuid",
      "is_read": true,
      "read_at": "2026-03-27T11:00:00Z",
      "created_at": "2026-03-27T10:00:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### Mark Notification Read

**PATCH** `/notifications/:id/read`

Mark a notification as read.

**Response (200):**
```json
{
  "notification": {
    "id": "notif-uuid",
    "is_read": true,
    "read_at": "2026-03-27T12:00:00Z"
  }
}
```

---

## Achievements

### Get User Achievements

**GET** `/achievements`

Get all achievements and user's unlock status.

**Response (200):**
```json
{
  "achievements": [
    {
      "key": "first_claim",
      "name": "First Blood",
      "description": "Claim your first bounty",
      "icon": "🎯",
      "tier": "common",
      "reward_points": 100,
      "unlocked": true,
      "unlocked_at": "2026-01-05T00:00:00Z",
      "progress": {
        "current": 1,
        "target": 1
      }
    },
    {
      "key": "bounty_master",
      "name": "Bounty Master",
      "description": "Create 50 bounties",
      "icon": "👑",
      "tier": "legendary",
      "reward_points": 1000,
      "unlocked": false,
      "progress": {
        "current": 12,
        "target": 50
      }
    }
  ],
  "total_unlocked": 7,
  "total_achievements": 24
}
```

---

## WebSocket Events (Realtime)

Connect to Supabase Realtime for live updates.

**Connection:**
```javascript
const channel = supabase
  .channel('bounty-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bounties',
    filter: `location=within(5000,${lat},${lng})`
  }, (payload) => {
    console.log('New bounty nearby!', payload.new);
  })
  .subscribe();
```

**Event Types:**
- `bounty_created` - New bounty nearby
- `bounty_claimed` - Bounty claimed (for creators)
- `hunt_started` - Someone started hunting your bounty
- `level_up` - User ranked up
- `achievement_unlocked` - New achievement

---

## Testing Endpoints

### Generate Test Bounty (Dev Only)

**POST** `/dev/generate-bounty`

Requires `NODE_ENV=development`.

**Request Body:**
```json
{
  "count": 10,
  "radius_km": 5,
  "center": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

Generates random bounties for testing.

---

**Next Steps:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide.
