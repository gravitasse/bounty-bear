# 🐻 Bounty Bear - Distributed Geocaching Game

> "I'm the bear - the bounty bear! I can find them anywhere!"

**Bounty Bear** transforms the retro terminal demo into a **distributed, asynchronous geocaching-style game** where players create GPS-located bounties with progressive clues. Hunt real-world treasures, scan QR codes, earn points, and climb the leaderboards - all while preserving that nostalgic CRT terminal aesthetic.

**🎮 [Play Now](https://bounty-bear.vercel.app)** | **📖 [Game Design](./GAME_DESIGN.md)** | **🛠️ [API Docs](./API.md)**

---

## ✨ Features

### 🗺️ **GPS-Based Gameplay**
- Create bounties at real-world locations
- Progressive clue system unlocks by proximity
- 10-meter verification radius for claims
- Anti-cheat with velocity and spoofing detection

### 🎯 **Multiple Verification Methods**
- **QR Codes**: Generate and scan unique codes
- **Photo Verification**: Match reference images
- **Passcode System**: Hidden physical notes

### 🏆 **Competition & Social**
- Global and local leaderboards
- Real-time activity feed
- Achievement system with rare badges
- Reputation levels and point economy

### 📱 **Mobile-First PWA**
- Installable progressive web app
- Works offline with service worker
- Optimized for GPS and camera access
- Retro terminal UI with CRT effects

---

## 🚀 Quick Start

### For Players

1. **Visit [bounty-bear.vercel.app](https://bounty-bear.vercel.app)**
2. **Sign up** with email or OAuth (Google, Apple, GitHub)
3. **Allow location access** for GPS-based gameplay
4. **Start hunting** nearby bounties or create your own
5. **Scan QR codes** to claim bounties and earn points

### For Developers

```bash
# Clone repository
git clone https://github.com/gravitasse/bounty-bear.git
cd bounty-bear

# Install dependencies
npm install

# Set up local Supabase
npx supabase start
npx supabase db push

# Configure environment
cp .env.example .env.local
# Add your Supabase and Mapbox tokens

# Start development server
npm run dev
```

**📚 [Full Development Guide](./DEVELOPMENT.md)**

---

## 🎮 How to Play

### 🔍 **Hunting Bounties**

1. **Discover**: Browse nearby bounties on the interactive map
2. **Accept Hunt**: Start tracking a bounty you want to claim
3. **Follow Clues**: Progressive hints unlock as you get closer:
   - **Clue 1**: Visible immediately (general area)
   - **Clue 2**: Unlocks at <500m (more specific)
   - **Clue 3**: Unlocks at <100m (exact location)
4. **Verify**: Scan QR code or submit photo when within 10 meters
5. **Claim**: Earn points and climb the leaderboard!

### 🎯 **Creating Bounties**

1. **Choose Location**: Use current GPS or drop a pin on the map
2. **Set Reward**: Stake 100-10,000 points (from your balance)
3. **Write Clues**: Create progressive hints that lead to your location
4. **Generate QR**: System creates unique verification code
5. **Hide & Publish**: Print QR code, hide it, and let the hunt begin!

### 🏆 **Progression System**

**Hunter Levels:**
- 🐻 **Rookie** (0-999 points)
- 🐻‍❄️ **Tracker** (1K-4.9K points)
- ⚡🐻 **Veteran** (5K-9.9K points)
- 👑🐻 **Legend** (10K+ points)

**Creator Levels:**
- **Novice** (0-5 bounties)
- **Strategist** (6-20 bounties)
- **Mastermind** (21-50 bounties)
- **Architect** (51+ bounties)

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel serverless functions
- **Database**: Supabase PostgreSQL + PostGIS (geospatial)
- **Auth**: Supabase Auth (JWT, OAuth providers)
- **Maps**: Mapbox GL JS
- **Storage**: Supabase Storage (QR codes, photos)
- **Real-time**: Supabase WebSockets

### Database Schema
```sql
users         -- Player profiles, points, reputation
bounties      -- GPS locations, clues, rewards
hunts         -- Active/completed hunts, progress
claims        -- Verification records, anti-cheat data
leaderboards  -- Cached rankings (global/local)
achievements  -- Unlockable badges and rewards
```

**📊 [Complete Database Schema](./DATABASE.md)**

---

## 🔒 Security & Anti-Cheat

### GPS Validation
- **Proximity Checks**: Must be within 10m of target
- **Velocity Validation**: Max 100 m/s movement speed
- **Location History**: Track suspicious movement patterns
- **Multiple Positioning**: GPS + Network + Passive location

### Verification Security
- **QR Code Signing**: HMAC signatures prevent forgery
- **Time-Limited Codes**: QR codes expire after 7 days
- **One-Time Use**: Codes marked as claimed after verification
- **Photo Similarity**: ML-based image matching (85% threshold)

### User Reporting
- **Community Moderation**: Flag suspicious claims
- **Manual Review Queue**: Human oversight for edge cases
- **Automated Banning**: Multiple infractions trigger account suspension

---

## 📱 Mobile Features

### PWA Capabilities
- **Installable**: Add to home screen on iOS/Android
- **Offline Mode**: Cache maps and continue hunts without internet
- **Background Sync**: Upload claims when connection returns
- **Push Notifications**: Real-time bounty alerts

### Camera Integration
- **QR Scanner**: Native camera access for verification
- **Photo Capture**: Take verification photos with EXIF data
- **Image Optimization**: Automatic compression and format conversion

### GPS Optimization
- **Battery Efficiency**: Intelligent location polling
- **Accuracy Modes**: High precision for verification, low for tracking
- **Permission Handling**: Graceful degradation without location access

---

## 🚀 Deployment

### Production (Vercel + Supabase)
```bash
# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

# Apply database migrations
npx supabase link --project-ref abc123
npx supabase db push
```

### Self-Hosting
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker build -t bounty-bear .
docker run -p 3000:3000 bounty-bear
```

**🚀 [Complete Deployment Guide](./DEPLOYMENT.md)**

---

## 🧪 Testing

### End-to-End Tests
```bash
# Run all tests
npm run test:e2e

# Test specific flow
npx playwright test e2e/bounty-hunt-flow.spec.ts

# Interactive testing
npm run test:ui
```

### Load Testing
```bash
# Test with 100 concurrent users
k6 run tests/load/bounty-api.js

# Monitor performance
npm run test:performance
```

### Manual Testing Checklist
- [ ] GPS accuracy across devices
- [ ] QR scanning in various lighting
- [ ] Offline functionality
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

---

## 📈 Analytics & Monitoring

### Key Metrics
- **Daily Active Users (DAU)**: Target 100+ by month 2
- **Bounty Claim Rate**: Target 75%+ success rate
- **Average Hunt Time**: 30-60 minutes per claim
- **Cheat Detection**: <2% of claims flagged

### Monitoring Stack
- **Performance**: Vercel Analytics (Core Web Vitals)
- **Errors**: Sentry (error tracking and alerts)
- **Database**: Supabase built-in monitoring
- **Custom Events**: Game-specific analytics

### Alerts
- **High Error Rate**: >1% of requests fail
- **Slow Response**: API >500ms (P95)
- **Database Issues**: Connection failures
- **Security Events**: Multiple failed authentications

---

## 🤝 Contributing

### Development Setup
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**: `npm install`
4. **Set up local database**: `npx supabase start`
5. **Run tests**: `npm test`
6. **Start dev server**: `npm run dev`

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with custom rules
- **Prettier**: Auto-formatting on save
- **Husky**: Pre-commit hooks for quality

### Pull Request Guidelines
- **Feature branches**: `feature/description`
- **Conventional commits**: `feat:`, `fix:`, `docs:`
- **Tests required**: E2E tests for user flows
- **Documentation**: Update relevant docs

**🛠️ [Development Guide](./DEVELOPMENT.md)**

---

## 📋 Roadmap

### MVP (Week 1-6)
- [x] Core terminal UI with Bear personality
- [x] GPS tracking and proximity detection
- [ ] Bounty creation and QR verification
- [ ] Points system and leaderboards
- [ ] Real-time notifications
- [ ] PWA with offline support

### Post-MVP (Month 2-3)
- [ ] Team hunts (collaborative solving)
- [ ] Photo verification (alternative to QR)
- [ ] Achievement system with rare badges
- [ ] Weekly challenges and events
- [ ] Advanced anti-cheat (ML-based)
- [ ] Premium tier ($4.99/month)

### Future Features
- [ ] AR overlays (view clues in camera)
- [ ] Voice commands (Bear responds to speech)
- [ ] Bounty marketplace (trading/NFTs)
- [ ] Business partnerships (sponsored bounties)
- [ ] Multi-language support
- [ ] Cross-platform mobile apps

**🗺️ [Complete Roadmap](./MVP_ROADMAP.md)**

---

## 💰 Business Model

### Free Tier (MVP)
- **Starting Balance**: 1,000 points
- **Unlimited Gameplay**: Create/hunt bounties without limits
- **All Core Features**: GPS tracking, verification, leaderboards
- **Ad-Free Experience**: No advertising (user experience first)

### Premium Tier ($4.99/month)
- **Monthly Points**: +5,000 bonus points
- **Exclusive Bears**: Neon blue, gold, holographic skins
- **Custom Clues**: Templates and advanced formatting
- **Early Access**: New features before free users
- **Premium Badge**: Status symbol on profile

### Revenue Projections
- **100K users × 5% conversion = 5K premium**
- **5K × $4.99 = $24,950/month**
- **Minus hosting costs (~$500) = $24K+ profit**

---

## 🎨 Brand & Design

### Visual Identity
- **Retro Terminal**: Green text on black, CRT scanlines
- **Bear Personality**: Confident, enthusiastic, slightly manic
- **Color Palette**: Matrix green (#00ff00), amber (#ffb000), red (#ff0000)
- **Typography**: Monospace (JetBrains Mono), pixelated UI elements

### Bear Dialogue Examples
- **Searching**: "I'm searching... I am identifying..."
- **Found**: "I got him! This is your guy!"
- **Success**: "FINDERS FEE: 500 POINTS!"
- **Failed**: "Target lost... expanding search parameters..."

### Sound Design
- **Terminal beeps**: Authentic retro computer sounds
- **Success fanfare**: 8-bit victory melody
- **Bear voice**: Text-to-speech with metallic processing
- **Background**: Subtle electronic hum

---

## 📞 Support

### Getting Help
- **Documentation**: Start with relevant guide above
- **GitHub Issues**: Bug reports and feature requests
- **Discord Community**: Real-time help and feedback
- **Email**: support@bounty-bear.app (for sensitive issues)

### FAQ

**Q: Do I need to pay to play?**
A: No! The core game is completely free. Premium adds bonus points and cosmetics.

**Q: How accurate is the GPS tracking?**
A: We require 10-meter accuracy for claims. Most modern phones achieve 3-5 meter precision.

**Q: Can I play without sharing my location?**
A: Location access is required for the core gameplay, but we never store or share your precise location data.

**Q: What if I can't scan the QR code?**
A: Contact us with the bounty ID and location. We can manually verify legitimate claims.

**Q: How do you prevent cheating?**
A: Multi-layer validation including GPS verification, velocity checks, and community reporting.

---

## 📄 License

MIT License - feel free to fork, modify, and use for your own projects!

**Original Inspiration**: "Until the End of the World" (1991) - Wim Wenders' prescient vision of AI agents.

---

## 🙏 Credits

- **Concept**: Inspired by geocaching and classic terminal interfaces
- **Film Reference**: "Until the End of the World" (Wim Wenders, 1991)
- **Tech Stack**: Next.js, Supabase, Mapbox, Vercel
- **Design**: Retro terminal aesthetics with modern UX
- **Community**: Beta testers and early adopters

---

**🎮 Ready to hunt? [Start Playing](https://bounty-bear.vercel.app)**

**🛠️ Ready to build? [Development Setup](./DEVELOPMENT.md)**

**📚 Want details? [Complete Documentation](./GAME_DESIGN.md)**