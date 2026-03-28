# Bounty Bear - Distributed Game Design

> "I'm the bear - the bounty bear! I can find them anywhere!"

## Overview

Bounty Bear transforms from a single-player terminal demo into a **distributed, asynchronous geocaching-style game** where players create and hunt real-world or virtual bounties. The game preserves the retro CRT terminal aesthetic while adding GPS-based gameplay, progressive clues, and social competition.

## Core Game Loop

```
CREATE → HIDE → HUNT → CLAIM → EARN → REPEAT
```

1. **CREATE**: Player creates a bounty with reward, clues, and location
2. **HIDE**: System publishes bounty to nearby hunters
3. **HUNT**: Hunters follow clues, unlock hints by proximity
4. **CLAIM**: First hunter to verify gets the reward
5. **EARN**: Points, reputation, achievements unlock
6. **REPEAT**: Use earnings to create bigger bounties

## Player Roles

### Creator (The Hider)
- **Action**: Create bounty with GPS location + clues
- **Investment**: Stake points as reward (min 100 points)
- **Bear Dialogue**:
  - "Setting the trap... Location locked!"
  - "Bounty published! Fee: [X] points"
  - "Your bounty has been claimed! Status: Complete"

### Hunter (The Seeker)
- **Action**: Browse nearby bounties, solve clues, verify location
- **Reward**: Earn points from successful claims
- **Bear Dialogue**:
  - "I'm searching... [X] bounties nearby!"
  - "Hot on the trail! Distance: 50 meters"
  - "I got him! This is your guy! Fee: [X] points"

## Game Mechanics

### 1. Bounty Creation
```
STEP 1: Set Reward
  - Min: 100 points (starter bounty)
  - Max: 10,000 points (legendary bounty)
  - Creator stakes points from balance

STEP 2: Hide Location
  - Use current GPS OR drop pin on map
  - Real-world locations (parks, landmarks, etc.)
  - Virtual locations (home-based gameplay)

STEP 3: Write Clues
  - Minimum 3 clues required
  - Progressive unlock system:
    - Clue 1: Visible immediately (easy/general)
    - Clue 2: Unlocks at <500m (medium/specific)
    - Clue 3: Unlocks at <100m (hard/precise)
  - Example clue progression:
    - "Near a place where water meets steel"
    - "Look for the red bridge, north side"
    - "Under the third bench from the fountain"

STEP 4: Verification Method
  - QR Code (auto-generated, printed/hidden at location)
  - Photo verification (must match reference photo)
  - Passcode (physical note at location)

Bear Terminal Output:
```
> CREATE BOUNTY

PROCESSING...
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%

LOCATION LOCKED: 37.7749° N, 122.4194° W
REWARD: 500 POINTS
CLUES: 3 PROGRESSIVE HINTS
VERIFICATION: QR CODE GENERATED

BOUNTY PUBLISHED!
FINDERS FEE: 500 POINTS
STATUS: ACTIVE
```

### 2. Bounty Hunting

**Discovery Phase:**
- Map shows nearby bounties within 5km radius
- Bounties appear as markers with:
  - Reward amount
  - Difficulty rating (based on clues)
  - Distance from current location
  - Creator's reputation level

**Tracking Phase:**
- Select bounty to "accept hunt"
- Clue 1 reveals immediately
- Distance indicator updates in real-time
- Bear provides running commentary:
  - "2.3 kilometers... getting warmer!"
  - "500 meters! Unlocking clue 2..."
  - "Hot on the trail! 50 meters to target!"

**Claiming Phase:**
- Within 10m of GPS location, verification activates
- QR Code: Scan with camera
- Photo: Take photo matching reference angle
- Passcode: Enter code found at location

**Success:**
```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%

I GOT HIM! THIS IS YOUR GUY!

TARGET: Golden Gate Viewpoint
LOCATION: Baker Beach Overlook
VERIFICATION: CONFIRMED ✓
CONFIDENCE: 100%

FINDERS FEE: 500 POINTS
+50 XP | REPUTATION: ★★★☆☆

STATUS: BOUNTY CLAIMED
```

### 3. Anti-Cheating Measures

**GPS Spoofing Prevention:**
- Velocity checks (can't teleport)
- Historical location patterns
- Require camera/sensor access during claim
- Flag suspicious claims for manual review

**Verification Requirements:**
- QR codes are unique, time-limited (24hr expiration)
- Photo verification uses ML image matching
- Passcodes rotate daily (creator gets notified)

**Fair Play:**
- Can't claim own bounties
- 1 active hunt at a time per player
- Cooldown period after failed claims (5 min)

### 4. Points & Economy

**Starting Balance:** 1,000 points (can create 10 starter bounties)

**Earning Points:**
- Claim bounty: Earn full reward amount
- First claim of the day: +50 bonus
- Streak bonus: Consecutive days playing (+10 per day)
- Achievement unlocks: Variable (50-500 points)

**Spending Points:**
- Create bounties: Stake minimum 100 points
- Power-ups (future):
  - Extra clue unlock: 50 points
  - Hint system: 25 points
  - Map refresh: 10 points

**Leaderboards:**
- Top Hunters (total points earned)
- Top Creators (bounties claimed by others)
- Weekly challenges (themed bounties)
- Local rankings (within 25km radius)

### 5. Reputation System

**Hunter Levels:**
- Rookie (0-999 points): 🐻
- Tracker (1K-4.9K): 🐻‍❄️
- Veteran (5K-9.9K): 🐻⚡
- Legend (10K+): 🐻👑

**Creator Levels:**
- Novice (0-5 bounties created)
- Strategist (6-20 bounties)
- Mastermind (21-50 bounties)
- Architect (51+ bounties)

**Reputation Benefits:**
- Higher levels unlock larger reward caps
- Featured on "Notable Bounties" list
- Custom Bear dialogue lines
- Exclusive achievement badges

## Social Features

### Real-Time Notifications
- "New bounty nearby! 1.2km away"
- "Someone is hunting your bounty!"
- "Your bounty was claimed! +500 reputation"
- "You ranked up! Now a Veteran Hunter"

### Activity Feed
- Recent claims in your area
- Friends' achievements
- Global leaderboard updates
- Weekly challenge announcements

### Teams (Future)
- Create hunting parties (2-4 players)
- Split rewards proportionally
- Team leaderboards
- Collaborative clue solving

## UI/UX Design

### Terminal Aesthetic (Preserved)
- Green monospace text on black
- CRT scan lines and glow effects
- Typewriter text animations
- ASCII progress bars
- Retro sound effects (beeps, blips)

### Mobile-First Interface

**Home Screen:**
```
╔═══════════════════════════════════════╗
║        🐻 BOUNTY BEAR SYSTEM          ║
║    "I can find them anywhere!"        ║
╠═══════════════════════════════════════╣
║                                       ║
║  > HUNT NEARBY BOUNTIES    [12]      ║
║  > CREATE NEW BOUNTY       [+]       ║
║  > VIEW LEADERBOARD        [🏆]      ║
║  > MY PROFILE              [⚙️]      ║
║                                       ║
║  BALANCE: 2,450 POINTS                ║
║  RANK: VETERAN HUNTER 🐻⚡             ║
║                                       ║
╚═══════════════════════════════════════╝
```

**Map View:**
- Fullscreen map with bounty markers
- Clustered markers for dense areas
- Filter by reward range, difficulty
- Bottom sheet with bounty details
- Real-time distance tracking

**Active Hunt View:**
- Large distance indicator (meters to target)
- Progressive clue reveals
- Compass pointing to target
- Bear status messages updating
- "Verify" button activates at <10m

### Desktop Enhancements
- Dual-pane: Map + Terminal
- Keyboard shortcuts (V for verify, M for map, etc.)
- Larger terminal history
- Multi-bounty tracking (side-by-side)

## Monetization Strategy

### Free Tier (MVP)
- 1,000 starting points
- Earn unlimited points through gameplay
- Create/hunt unlimited bounties
- Access to all core features
- Ads on leaderboard screen (optional)

### Premium Tier ($4.99/month)
- +5,000 bonus points monthly
- Ad-free experience
- Exclusive Bear skins (neon blue, gold, holographic)
- Custom clue templates
- Early access to new features
- Premium badge on profile

### In-App Purchases
- Point packs (1,000 points = $0.99)
- Cosmetic upgrades (terminal themes, sound packs)
- Power-up bundles
- No pay-to-win mechanics (can't buy leaderboard position)

## Success Metrics

**Engagement:**
- Daily Active Users (DAU)
- Bounties created per day
- Average hunt completion time
- Session length and frequency

**Retention:**
- Day 1, 7, 30 retention rates
- Weekly active user growth
- Churn analysis by cohort

**Monetization:**
- Premium conversion rate (target: 5%)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)

**Quality:**
- Bounty claim success rate (target: 70%)
- Average bounty difficulty (3-7 days active)
- Report/cheat rate (target: <2%)
- User satisfaction (in-app surveys)

## Future Features

### Phase 2 (Post-MVP)
- **Team Hunts**: Collaborative bounty solving
- **Custom Challenges**: Weekly themed events
- **Bounty Chains**: Multi-location quests
- **AR Overlays**: View clues in augmented reality
- **Voice Mode**: Bear narrates the entire hunt

### Phase 3 (Long-term)
- **Cross-Platform**: iOS, Android, Web PWA
- **International**: Multi-language support
- **Partnerships**: Collaborate with local businesses (sponsored bounties)
- **API Access**: Let developers create custom bounties
- **Bounty Marketplace**: Trade rare bounties/NFTs (optional)

## Development Priorities

**Week 1-2: Core MVP**
1. User auth (Supabase)
2. Bounty creation flow
3. GPS-based bounty discovery
4. QR code verification
5. Points system
6. Basic leaderboard

**Week 3-4: Polish**
7. Progressive clue unlock
8. Real-time notifications
9. Profile/reputation system
10. Mobile responsive design
11. Sound effects + animations
12. Anti-cheat measures

**Week 5-6: Testing & Launch**
13. Beta test with 50 users
14. Bug fixes and performance
15. Analytics integration
16. Soft launch (Product Hunt, HN)
17. Marketing materials (video, screenshots)
18. Public launch 🚀

---

**Next Steps:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical implementation details.
